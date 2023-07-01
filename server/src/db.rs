
use std::net::IpAddr;
use mongodb::{ options::ClientOptions, Collection };

#[derive(serde::Serialize, serde::Deserialize)]
pub struct LinkReservationDocument {
    pub reserved_at: bson::Timestamp,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct LinkRedirectDocument {
    pub target: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum LinkSpecialDocument {
    Reservation(LinkReservationDocument),
    Redirection(LinkRedirectDocument),
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct LinkDocument {
    pub name: String,
    #[serde(skip_serializing_if="std::ops::Not::not",default)]
    pub random_name: bool,

    #[serde(skip_serializing_if="Option::is_none")]
    pub created_at: Option<bson::Timestamp>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub created_by_ip: Option<IpAddr>,

    #[serde(flatten)]
    pub special: LinkSpecialDocument,
}

pub struct DBAccess {
    pub links_collection: Collection<LinkDocument>
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
            links_collection: db.collection("links")
        }
    }
}
