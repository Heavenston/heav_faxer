#[macro_use] extern crate rocket;

use std::net::IpAddr;

use either::{
    Either,
    Either::*,
};
use rocket::{
    response::{ Redirect, status::NotFound },
    Config,
    http::Header, State,
};
use mongodb::{ options::ClientOptions, Collection };

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
) -> Either<Redirect, NotFound<Either<String, Redirect>>> {
    let Some(link) = db.links_collection.find_one(Some(bson::doc!{
        "name": link.as_str()
    }), None).await.unwrap() else {
        return Right(NotFound(match or {
            None => Left("Could not find link".into()),
            Some(x) => Right(Redirect::temporary(x)),
        }));
    };
    
    Left(Redirect::temporary(link.target))
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
            get_link
        ])
}
