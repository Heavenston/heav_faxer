#![allow(incomplete_features)]
#![feature(adt_const_params)]
#![feature(hash_extract_if)]

mod db;
mod rate_limiter;
#[macro_use] extern crate rocket;

use std::{net::SocketAddr, time::Instant};

use db::{DBAccess, LinkRedirectDocument, LinkSpecialDocument, LinkDocument};
use either::{
    Either,
    Either::*,
};
use rocket::{
    response::Redirect,
    Config,
    http::{Header, Status}, State, serde::json::Json, Request,
};

#[catch(404)]
fn catch_404() -> serde_json::Value {
    serde_json::json!({
        "success": false,
        "http_code": 404,
        "error": "Not Found",
        "message": "Uknown Endpoint",
    })
}

#[catch(429)]
fn catch_429(request: &Request) -> serde_json::Value {
    let rate_limited_state: &Option<rate_limiter::RateLimitedLocalCache> =
        request.local_cache(|| None);

    match rate_limited_state {
        Some(x) => {
            let secs = x.until
                .saturating_duration_since(Instant::now()).as_secs();
            serde_json::json!({
                "success": false,
                "http_code": 429,
                "error": "Too Many Requests",
                "message": format!("Too many requests, retry in {secs} seconds"),
                "retry_in": secs,
            })
        }
        None => {
            serde_json::json!({
                "success": false,
                "http_code": 429,
                "error": "Too Many Requests",
                "message": format!("Too many requests, please retry later"),
            })
        }
    }

}

#[catch(default)]
fn catch_all(status: Status, _request: &Request) -> serde_json::Value {
    serde_json::json!({
        "success": false,
        "http_code": status.code,
        "error": status.reason().map(String::from).unwrap_or("Uknown".to_string())
    })
}

#[get("/<link>?<or>")]
async fn get_link(
    _rate_limiter: rate_limiter::RateLimited<"GET_LINK", 300>,
    db: &State<DBAccess>,
    link: String, or: Option<String>
) -> Either<Redirect, (Status, serde_json::Value)> {
    let Some(link) = db.links_collection.find_one(Some(bson::doc!{
        "name": link.as_str()
    }), None).await.unwrap() else {
        return match or {
            Some(x) => Left(Redirect::temporary(x)),
            None => Right((Status::NotFound, serde_json::json!({
                "success": false,
                "error": "not_found",
                "message": format!("Link with name {link} not found"),
            }))),
        };
    };

    match link.special {
        LinkSpecialDocument::Reservation(_) => {
            match or {
                Some(x) => Left(Redirect::temporary(x)),
                None => Right((Status::NotFound, serde_json::json!({
                    "success": false,
                    "error": "reserved",
                    "message": format!("Link {} is reserved but not assigned", link.name),
                }))),
            }
        }
        LinkSpecialDocument::Redirection(red) => {
            Left(Redirect::temporary(red.target))
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct LinkPostBody {
    target: url::Url,
}

#[post("/<link>", format = "application/json", data = "<body>")]
async fn post_link(
    _rate_limiter: rate_limiter::RateLimited<"POST_LINK", 5>,
    addr: SocketAddr,
    db: &State<DBAccess>,
    link: String,
    body: Json<LinkPostBody>,
) -> (Status, serde_json::Value) {
    let existing = db.links_collection.find_one(bson::doc!{
        "name": link.as_str(),
    }, None).await.unwrap();

    if existing.is_some() {
        return (
            Status::Conflict,
            serde_json::json!({
                "success": false,
                "error": "link_already_exist",
                "message": "A link with the same name already exists."
            })
        );
    }

    db.links_collection.insert_one(
        LinkDocument {
            name: link.clone(),

            created_at: Some(bson::Timestamp {
                time: 0,
                increment: 0,
            }),
            created_by_ip: Some(addr.ip()),

            special: LinkSpecialDocument::Redirection(LinkRedirectDocument {
                target: body.target.to_string(),
            }),
        },
        None
    ).await.unwrap();

    (Status::Ok, serde_json::json!({
        "success": true
    }))
}

#[post("/link/<_link>", rank = 2)]
async fn post_link_error(_link: String) -> (Status, serde_json::Value) {
    (Status::BadRequest, serde_json::json!({
        "success": false,
        "error": "bad_request",
    }))
}

#[launch]
async fn rocket() -> _ {
    let db_access =
        DBAccess::connect(
            &std::env::var("MONGODB_CONNECTION")
                .expect("Not mongodb connection string specified")
        ).await;

    rocket::build()
        .manage(db_access)
        .manage(rate_limiter::RateLimitState::new())
        .configure(Config {
            port: std::env::var("PORT").expect("No port specified")
                .parse().expect("Invalid port"),
            address: "0.0.0.0".parse().unwrap(),
            ..Default::default()
        })
        .attach(rocket::fairing::AdHoc::on_response("cors", |_, res| {
            Box::pin(async move {
                res.set_header(Header::new(
                    "Access-Control-Allow-Origin", "*"
                ));
                res.set_header(Header::new(
                    "Access-Control-Allow-Methods", "*"
                ));
                res.set_header(Header::new(
                    "Access-Control-Allow-Headers", "*"
                ));
                res.set_header(Header::new(
                    "Access-Control-Allow-Credentials", "true"
                ));
            })
        }))
        .attach(rocket::fairing::AdHoc::on_request("cors", |req, _| {
            Box::pin(async move {
                let uri = req.uri();
                let mut new_uri = uri.map_path(
                    |p| p.strip_prefix("/api").unwrap_or(p)
                ).unwrap_or(uri.clone());
                new_uri.normalize();
                req.set_uri(new_uri);
            })
        }))
        .mount("/link", routes![
            get_link, post_link, post_link_error
        ])
        .mount("/l", routes![
            get_link, post_link, post_link_error
        ])
        .register("/", catchers![
            catch_404, catch_429, catch_all
        ])
}
