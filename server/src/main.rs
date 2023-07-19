#![allow(incomplete_features)]
#![feature(adt_const_params)]
#![feature(hash_extract_if)]

mod db;
mod rate_limiter;
mod utils;
mod files;
#[macro_use] extern crate rocket;

use std::{time::{Instant, SystemTime, Duration}, path::PathBuf};

use argon2::Argon2;
use bson::oid::ObjectId;
use rand::prelude::*;
use db::{DBAccess, LinkRedirectDocument, LinkSpecialDocument, LinkDocument, FileDocument, FileConfirmationState};
use either::{
    Either,
    Either::*,
};
use rocket::{
    response::Redirect,
    Config,
    http::{Header, Status}, State, serde::json::Json, Request, futures::TryStreamExt,
};

const ARGON2_SALT: &[u8] = b"very useful salt";

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
            _id: bson::oid::ObjectId::new(),

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
struct LinkDeleteBody<'r> {
    write_password: &'r str,
}

#[delete("/<link>", format = "application/json", data = "<body>")]
async fn delete_link(
    _rate_limiter: rate_limiter::RateLimited<"POST_LINK", 10>,
    db: &State<DBAccess>,
    argon2: &State<Argon2<'static>>,
    link: &str,
    body: Json<LinkDeleteBody<'_>>,
) -> (Status, serde_json::Value) {
    let hashed_pass = {
        let mut v = vec![0u8; argon2.params().output_len().unwrap()];
        argon2.hash_password_into(
            body.write_password.as_bytes(), ARGON2_SALT, &mut v
        ).unwrap();
        v
    };

    let Some(found) = db.links_collection.find_one(
        bson::doc!{ "name": link, }, None
    ).await.unwrap() else {
        return (Status::NotFound, serde_json::json!({
            "success": false,
            "error": "Not Found",
            "message": format!("A link with the name {link}"),
        }));
    };

    if found.write_password_hash.map(|x| x == hashed_pass).unwrap_or(false) {
        db.links_collection.delete_one(bson::doc!{ "name": link }, None)
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

#[derive(serde::Deserialize)]
struct LinkFilePostData<'r> {
    file_hash: &'r str,
    mime_type: &'r str,
    file_size: u64,
}

// FIXME: Disgusting code, sorry
#[post("/<input_full_name>", format = "application/json", data = "<body>")]
async fn post_file(
    _rate_limiter: rate_limiter::RateLimited<"POST_LINK", 10>,
    addr: utils::RealIp,
    db: &State<DBAccess>,
    files: &State<files::FilesManager>,
    body: Json<LinkFilePostData<'_>>,
    input_full_name: &str,
) -> (Status, serde_json::Value) {
    if body.file_size > 1_000_000_000 {
        return (Status::PayloadTooLarge, serde_json::json!({
            "success": false,
            "error": "too_big",
            "message": "File is over the 1Gb limit",
        }));
    }

    let final_name;
    let final_ext;
    let final_location;

    let is_random_name;
    let should_create;

    let (
        input_file_name,
        input_file_ext
    ) = input_full_name.rsplit_once('.').unwrap_or((&input_full_name, ""));

    if input_file_name == "random" {
        let mut with_same_hash = db.files_collection.find(
            bson::doc!{
                "user_provided_hash": body.file_hash,
                "extension": input_file_ext,
                "random_name": true,
                "mime_type": body.mime_type,
                "confirmation_state": { "$ne": bson::to_bson(&
                    db::FileConfirmationState::Invalid
                ).unwrap() },
            },
            None
        ).await.unwrap();

        let mut reuse: Option<FileDocument> = None;
        while let Some(doc) = with_same_hash.try_next().await.expect("Fetch error") {
            if doc.confirmation_state.is_confirmed()
            { reuse = Some(doc); break }

            let ctm = doc.confirmation_timeout.unwrap_or(0);
            let timeout_time = doc.created_at.as_ref()
                .map(utils::timestamp_to_time)
                .map(|c| c + Duration::from_secs(ctm))
                .unwrap_or(SystemTime::UNIX_EPOCH);

            // Timeoute's in the future
            if timeout_time.elapsed().is_err()
            { continue }

            let Some(r) = files.read_file(&doc.location).await
                else { continue };
            let is_valid = r.real_hash.map(|h| h == body.file_hash)
                .unwrap_or(false);

            let new_state = if is_valid {
                db::FileConfirmationState::Confirmed
            } else {
                db::FileConfirmationState::Invalid
            };

            db.files_collection.update_one(
                bson::doc! { "_id": doc._id },
                bson::doc! {
                    "$set": {
                        "confirmation_state": bson::to_bson(&new_state).unwrap()
                    }
                },
                None,
            ).await.expect("Failed to update");

            if is_valid {
                reuse = Some(doc);
                break;
            }
        }

        is_random_name = true;
        if let Some(existing) = reuse {
            final_name = existing.name;
            final_ext = existing.extension;
            final_location = existing.location;
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
                exist = db.files_collection.find_one(bson::doc!{
                    "name": random_name.as_str(),
                    "extension": input_file_ext,
                }, None).await.unwrap().is_some();
                random_name_length += 1;
            }
            final_name = random_name;
            final_ext = input_file_ext.to_string();
            final_location = files.new_location(&(
                if final_ext != "" { final_name.clone() + "." + &final_ext }
                else { final_name.clone() }
            ));
            should_create = true;
        }
    }
    else {
        let existing = db.files_collection.find_one(bson::doc!{
            "name": input_full_name,
        }, None).await.unwrap();

        match existing {
            None => (),
            Some(db::FileDocument {
                user_provided_hash: Some(h),
                ..
            }) if h == body.file_hash => return (
                Status::Ok,
                serde_json::json!({
                    "success": true,
                    "result": "already_known",
                    "name": input_full_name.to_string(),
                })
            ),
            Some(_) => return (
                Status::Conflict,
                serde_json::json!({
                    "success": false,
                    "error": "file_already_exist",
                    "message": "A file with the same name already exists."
                })
            ),
        }

        final_name = input_file_name.to_string();
        final_ext = input_file_ext.to_string();
        final_location = files.new_location(&(
            if final_ext != "" { final_name.clone() + "." + &final_ext }
            else { final_name.clone() }
        ));
        is_random_name = false;
        should_create = true;
    }

    // FIXME: Very ugly here
    let upload_url =
        if should_create { 'should: {
            let create_rstlt = files.create_file(
                &final_location,
                body.mime_type,
                body.file_hash,
                Some(body.file_size),
            ).await;
            let ur = match create_rstlt {
                files::FileCreateResult::UknownLocation =>
                    break 'should None,
                files::FileCreateResult::Success { upload_url }
                    => upload_url,
            };

            let doc = db::FileDocument {
                _id: ObjectId::new(),

                location: final_location,
                random_name: is_random_name,
                mime_type: Some(body.mime_type.to_string()),
                file_size: Some(body.file_size),

                name: final_name.clone(),
                extension: input_file_ext.to_string(),

                confirmation_state: FileConfirmationState::Unconfirmed,
                confirmation_timeout: Some(
                    files::FilesManager::UPLOAD_URL_DURATION.as_secs()
                ),

                user_provided_hash: Some(body.file_hash.to_string()),
                created_at: Some(bson::Timestamp {
                    time: 0,
                    increment: 0,
                }),
                created_by_ip: addr.0,
            };
            db.files_collection.insert_one(doc, None).await.unwrap();

            Some(ur)
        } }
        else {
            None
        };


    let final_full_name =
        if final_ext != "" { final_name.clone() + "." + &final_ext }
        else { final_name.clone() };
    
    match upload_url {
        None =>
            (Status::Ok, serde_json::json!({
                "success": true,
                "result": "already_known",
                "name": &final_full_name,
            })),
        Some(u) =>
            (Status::Ok, serde_json::json!({
                "success": true,
                "result": "must_upload",
                "upload_url": u,
                "name": &final_full_name,
            })),
    }
}

#[options("/<_route..>")]
fn preflight_response(_route: PathBuf) -> Status {
    Status::Ok
}

#[launch]
async fn rocket() -> _ {
    let mongodb_connection = std::env::var("MONGODB_CONNECTION")
        .expect("Not mongodb connection string specified");
    let port = std::env::var("PORT")
        .expect("Not mongodb connection string specified")
        .parse().expect("Invalid port");
    let storage_bucket_name = std::env::var("CLOUD_STORAGE_BUCKET")
        .expect("No storage bucket specified");
    let storage_bucket_subpath = std::env::var("CLOUD_STORAGE_SUBPATH")
        .unwrap_or_default();

    let db_access = DBAccess::connect(&mongodb_connection).await;

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
        .manage(files::FilesManager::new(
            storage_bucket_name, storage_bucket_subpath
        ).await)
        .configure(Config {
            port,
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
        .mount("/l", routes![ get_link ])
        .mount("/file", routes![ post_file ])
        .mount("/", routes![
            preflight_response, post_file
        ])
        .register("/", catchers![
            catch_404, catch_429, catch_all
        ])
}
