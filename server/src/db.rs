
use std::net::IpAddr;
use mongodb::{ options::ClientOptions, Collection };
use serde_with::{ serde_as, PickFirst, DisplayFromStr, DefaultOnError };

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkReservationDocument {
    pub reserved_at: bson::Timestamp,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkRedirectDocument {
    pub target: String,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum LinkSpecialDocument {
    Reservation(LinkReservationDocument),
    Redirection(LinkRedirectDocument),
}

#[serde_as]
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkDocument {
    pub name: String,
    #[serde(skip_serializing_if="std::ops::Not::not",default)]
    pub random_name: bool,

    #[serde(default, skip_serializing_if="Option::is_none")]
    pub write_password_hash: Option<Vec<u8>>,
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub created_at: Option<bson::Timestamp>,
    #[serde_as(as="Option<PickFirst<(DisplayFromStr, _)>>")]
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub created_by_ip: Option<IpAddr>,

    #[serde(flatten)]
    pub special: LinkSpecialDocument,
}

#[serde_as]
#[derive(Clone, Default, serde::Serialize, serde::Deserialize)]
#[serde(tag="type", rename_all="snake_case")]
pub enum FileLocation {
    GCS {
        bucket_name: String,
        file_name: String,
    },
    #[default]
    Other,
}

#[serde_as]
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct FileDocument {
    #[serde_as(as="DefaultOnError<_>")]
    pub location: FileLocation,
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub user_provided_hash: Option<String>,

    pub name: String,
    #[serde(skip_serializing_if="std::ops::Not::not",default)]
    pub random_name: bool,

    #[serde(default, skip_serializing_if="Option::is_none")]
    pub created_at: Option<bson::Timestamp>,
    #[serde_as(as="Option<PickFirst<(DisplayFromStr, _)>>")]
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub created_by_ip: Option<IpAddr>,
}

pub struct DBAccess {
    pub links_collection: Collection<LinkDocument>,
    pub files_collection: Collection<FileDocument>,
}

impl DBAccess {
    pub async fn connect(string: &str) -> Self {
        let mut client_options = ClientOptions::parse(
            string
        ).await.expect("failed to parse db connection string");
        client_options.app_name = Some("head-faxer".to_string());

        let client = mongodb::Client::with_options(client_options)    
            .expect("Could not create db client");
        let db = client.default_database()
            .expect("No default database specified");

        Self {
            links_collection: db.collection("links"),
            files_collection: db.collection("files"),
        }
    }
}
