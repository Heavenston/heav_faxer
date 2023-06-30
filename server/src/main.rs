#[macro_use] extern crate rocket;

use either::{
    Either,
    Either::*,
};
use rocket::{
    response::{ Redirect, status::NotFound },
    Config,
    http::Header,
};

#[get("/link/<link>?<or>")]
fn link(
    link: String, or: Option<String>
) -> Either<Redirect, NotFound<Either<String, Redirect>>> {
    if link == "test" {
        return Right(NotFound(match or {
            None => Left("Could not find link".into()),
            Some(x) => Right(Redirect::temporary(x)),
        }));
    }
    
    Left(Redirect::temporary("http://google.com"))
}

#[launch]
fn rocket() -> _ {
    rocket::build()
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
            link
        ])
}
