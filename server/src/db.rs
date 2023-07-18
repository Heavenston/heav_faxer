
use std::net::IpAddr;
use mongodb::{ options::ClientOptions, Collection };
use serde_with::{ serde_as, PickFirst, DisplayFromStr, DefaultOnError };

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkReservationDocument {
    pub reserved_at: bson::Timestamp,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkRedirectDocument {
    pub target: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum LinkSpecialDocument {
    Reservation(LinkReservationDocument),
    Redirection(LinkRedirectDocument),
}

#[serde_as]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LinkDocument {
    pub _id: bson::oid::ObjectId,

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
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
#[serde(tag="type", rename_all="snake_case")]
pub enum FileLocation {
    Gcs {
        bucket_name: String,
        file_name: String,
    },
    #[default]
    Other,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all="snake_case")]
pub enum FileConfirmationState {
    #[default]
    Unconfirmed,
    Confirmed,
    Invalid,
}
#[allow(dead_code)]
impl FileConfirmationState {
    pub fn skip(&self) -> bool {
        self == &Self::default()
    }

    pub fn is_unconfirmed(&self) -> bool {
        matches!(self, FileConfirmationState::Unconfirmed)
    }

    pub fn is_confirmed(&self) -> bool {
        matches!(self, FileConfirmationState::Confirmed)
    }

    pub fn is_invalid(&self) -> bool {
        matches!(self, FileConfirmationState::Invalid)
    }
}

#[serde_as]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileDocument {
    pub _id: bson::oid::ObjectId,

    #[serde_as(as="DefaultOnError<_>")]
    pub location: FileLocation,
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub user_provided_hash: Option<String>,
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub mime_type: Option<String>,

    pub name: String,
    pub extension: String,

    #[serde(default, skip_serializing_if="std::ops::Not::not")]
    pub random_name: bool,
    #[serde(default, skip_serializing_if="FileConfirmationState::skip")]
    pub confirmation_state: FileConfirmationState,
    #[serde(default, skip_serializing_if="Option::is_none")]
    pub confirmation_timeout: Option<u64>,

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
