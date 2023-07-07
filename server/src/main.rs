#![allow(incomplete_features)]
#![feature(adt_const_params)]
#![feature(hash_extract_if)]

mod db;
mod rate_limiter;
mod utils;
#[macro_use] extern crate rocket;

use std::{time::Instant, path::PathBuf};

use argon2::Argon2;
use rand::prelude::*;
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

const ARGON2_SALT: &[u8] = b"very unuseful salt";

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
    #[serde(default)]
    write_password: Option<String>,
    target: url::Url,
}

#[post("/<link>", format = "application/json", data = "<body>")]
async fn post_link(
    _rate_limiter: rate_limiter::RateLimited<"POST_LINK", 10>,
    addr: utils::RealIp,
    db: &State<DBAccess>,
    argon2: &State<Argon2<'static>>,
    link: String,
    body: Json<LinkPostBody>,
) -> (Status, serde_json::Value) {
    let hashed_pass = body.write_password.as_ref().map(|pass| {
        let mut v = vec![0u8; argon2.params().output_len().unwrap()];
        argon2.hash_password_into(pass.as_bytes(), ARGON2_SALT, &mut v)
            .unwrap();
        v
    });

    let str_target = body.target.to_string();

    let final_name;
    let is_random_name;
    let should_create;
    let mut should_replace = false;

    if link == "random" {
        let with_same_target = db.links_collection.find_one(bson::doc!{
            "target": str_target.as_str(),
            "random_name": true,
        }, None).await.unwrap();

        is_random_name = true;
        if let Some(already) = with_same_target {
            final_name = already.name;
            should_create = false;
        }
        else {
            const ALPHABET: &str = "ABCDEFGHJKMNOPQRSTUVWXYZabcdefghjkmnopqrsuvwxyz";

            let mut random_name_length = 4;
            let mut random_name = "".to_string();
            let mut exist = true;
            while exist {
                random_name = ALPHABET.chars()
                    .choose_multiple(&mut thread_rng(), random_name_length)
                    .into_iter().collect::<String>();
                exist = db.links_collection.find_one(bson::doc!{
                    "name": random_name.as_str(),
                }, None).await.unwrap().is_some();
                random_name_length += 1;
            }
            final_name = random_name;
            should_create = true;
        }
    }
    else {
        let existing = db.links_collection.find_one(bson::doc!{
            "name": link.as_str(),
        }, None).await.unwrap();

        match existing {
            Some(LinkDocument { write_password_hash: Some(ref hash), .. })
                if Some(hash) == hashed_pass.as_ref()
            => {
                should_replace = true;
            },
            None => (),
            Some(_) => return (
                Status::Conflict,
                serde_json::json!({
                    "success": false,
                    "error": "link_already_exist",
                    "message": "A link with the same name already exists."
                })
            ),
        }

        final_name = link.clone();
        is_random_name = false;
        should_create = true;
    }

    if should_create {
        let doc = LinkDocument {
            name: final_name.clone(),
            random_name: is_random_name,

            write_password_hash: hashed_pass,
            created_at: Some(bson::Timestamp {
                time: 0,
                increment: 0,
            }),
            created_by_ip: addr.0,

            special: LinkSpecialDocument::Redirection(LinkRedirectDocument {
                target: body.target.to_string(),
            }),
        };
        if should_replace {
            db.links_collection.replace_one(
                bson::doc! { "name": final_name.clone() },
                doc, None
            ).await.unwrap();
        }
        else {
            db.links_collection.insert_one(doc, None).await.unwrap();
        }
    }

    (Status::Ok, serde_json::json!({
        "success": true,
        "link_name": final_name
    }))
}

#[post("/<_link>", rank = 2)]
async fn post_link_error(_link: String) -> (Status, serde_json::Value) {
    (Status::BadRequest, serde_json::json!({
        "success": false,
        "error": "Bad Request",
    }))
}

#[derive(serde::Serialize, serde::Deserialize)]
struct LinkDeleteBody {
    write_password: String,
}

#[delete("/<link>", format = "application/json", data = "<body>")]
async fn delete_link(
    _rate_limiter: rate_limiter::RateLimited<"POST_LINK", 10>,
    db: &State<DBAccess>,
    argon2: &State<Argon2<'static>>,
    link: String,
    body: Json<LinkDeleteBody>,
) -> (Status, serde_json::Value) {
    let hashed_pass = {
        let mut v = vec![0u8; argon2.params().output_len().unwrap()];
        argon2.hash_password_into(
            body.write_password.as_bytes(), ARGON2_SALT, &mut v
        ).unwrap();
        v
    };

    let Some(found) = db.links_collection.find_one(
        bson::doc!{ "name": link.as_str(), }, None
    ).await.unwrap() else {
        return (Status::NotFound, serde_json::json!({
            "success": false,
            "error": "Not Found",
            "message": format!("A link with the name {link}"),
        }));
    };

    if found.write_password_hash.map(|x| x == hashed_pass).unwrap_or(false) {
        db.links_collection.delete_one(bson::doc!{ "name": link.as_str() }, None)
            .await.unwrap();
        (Status::Ok, serde_json::json!({
            "success": true,
        }))
    }
    else {
        (Status::Forbidden, serde_json::json!({
            "success": false,
            "error": "Forbidden",
            "message": "Link could not be deleted because the provided password does not match"
        }))
    }
}

#[options("/<_route..>")]
fn preflight_response(_route: PathBuf) -> Status {
    Status::Ok
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
        .manage(Argon2::<'static>::new(
            argon2::Algorithm::Argon2id,
            argon2::Version::V0x13,
            argon2::ParamsBuilder::new()
                .output_len(16)
                .t_cost(1)
                .p_cost(1)
                .build().unwrap()
        ))
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
            get_link, post_link, post_link_error, delete_link
        ])
        .mount("/l", routes![
            get_link, post_link, post_link_error, delete_link
        ])
        .mount("/", routes![
            preflight_response
        ])
        .register("/", catchers![
            catch_404, catch_429, catch_all
        ])
}
