#[macro_use] extern crate rocket;

use std::net::{IpAddr, SocketAddr};

use either::{
    Either,
    Either::*,
};
use rocket::{
    response::{ Redirect, status::NotFound },
    Config,
    http::{Header, Status}, State, serde::json::Json, Request, Response,
};
use mongodb::{ Client, options::ClientOptions, Collection };

#[catch(404)]
fn catch_404() -> serde_json::Value {
    serde_json::json!({
        "success": false,
        "http_code": 404,
        "error": "Not Found",
        "message": "Uknown Endpoint",
    })
}

#[catch(default)]
fn catch_all(status: Status, _request: &Request) -> serde_json::Value {
    serde_json::json!({
        "success": false,
        "http_code": status.code,
        "error": status.reason().map(String::from).unwrap_or("Uknown".to_string())
    })
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Link {
    #[serde(skip_serializing_if="Option::is_none")]
    pub created_at: Option<bson::Timestamp>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub created_by_ip: Option<IpAddr>,

    pub name: String,
    pub target: String,
}

pub struct DBConfig {
    pub links_collection: Collection<Link>
}

#[get("/link/<link>?<or>")]
async fn get_link(
    db: &State<DBConfig>,
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
    
    Left(Redirect::temporary(link.target))
}

#[derive(serde::Serialize, serde::Deserialize)]
struct LinkPostBody {
    target: url::Url,
}

#[post("/link/<link>", format = "application/json", data = "<body>")]
async fn post_link(
    addr: SocketAddr,
    db: &State<DBConfig>,
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
        Link {
            name: link.clone(),
            target: body.target.to_string(),

            created_at: Some(bson::Timestamp {
                time: 0,
                increment: 0,
            }),
            created_by_ip: Some(addr.ip()),
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
    let mut client_options = ClientOptions::parse(
        std::env::var("MONGODB_CONNECTION").unwrap()
    ).await.expect("failed to parse db connection string");
    client_options.default_database = Some("dev".to_string());
    client_options.app_name = Some("head-faxer".to_string());

    let client = mongodb::Client::with_options(client_options)    
        .expect("Could not create db client");
    let db = client.default_database()
        .expect("No default database specified");

    rocket::build()
        .manage(DBConfig {
            links_collection: db.collection("links"),
        })
        .configure(Config {
            port: 1234,
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
        .mount("/", routes![
            get_link,
            post_link, post_link_error
        ])
        .register("/", catchers![
            catch_404, catch_all
        ])
}
