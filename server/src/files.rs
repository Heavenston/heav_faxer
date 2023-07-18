use std::time::Duration;

use google_cloud_storage::{
    client::{ Client as GClient, ClientConfig as GClientCfg }, http::objects::{get::GetObjectRequest, upload::{UploadObjectRequest, UploadType, Media}}, sign::{SignedURLOptions, SignedURLMethod},
};

use crate::db;

#[derive(Debug)]
pub struct FileInfo {
    pub real_hash: Option<String>,
    pub mime_type: Option<String>,
    pub size: u64,
    pub location: db::FileLocation,
}

pub enum FileCreateResult {
    AlreadyUploaded {
        
    },
    NameInUse {
        file_hash: String,
    },
    Success {
        upload_url: String,
    },
}

pub struct FilesManager {
    client: GClient,
    bucket_name: String,
    subpath: String,
}

impl FilesManager {
    pub async fn new(
        bucket_name: String,
        subpath: String,
    ) -> Self {
        let config = GClientCfg::default().with_auth().await.unwrap();
        let client = GClient::new(config);

        Self {
            client,
            bucket_name,
            subpath,
        }
    }

    pub fn new_location(
        &self, file_name: impl Into<String>
    ) -> db::FileLocation {
        db::FileLocation::Gcs {
            bucket_name: self.bucket_name.clone(),
            file_name: file_name.into(),
        }
    }

    pub async fn read_file(
        &self, location: db::FileLocation,
    ) -> Option<FileInfo> {
        match &location {
            db::FileLocation::Gcs {
                bucket_name, file_name
            } => {
                // FIXME: Differenciate errors
                let object = self.client.get_object(&GetObjectRequest {
                    bucket: bucket_name.to_string(),
                    object: file_name.to_string(),
                    ..Default::default()
                }).await.ok()?;
                println!("{:?}", object.md5_hash);

                Some(FileInfo {
                    real_hash: object.md5_hash,
                    mime_type: object.content_type,
                    size: object.size.max(0).try_into().unwrap(),
                    location,
                })
            },
            db::FileLocation::Other => None,
        }
    }

    pub async fn create_file(
        &self, hash: &str, name: &str, mime_type: &str,
    ) -> FileCreateResult {
        // FIXME: Differenciate errors
        let object = self.client.get_object(&GetObjectRequest {
            bucket: self.bucket_name.to_string(),
            object: name.to_string(),
            ..Default::default()
        }).await.ok();

        match object {
            Some(o) if o.md5_hash.as_ref().map(String::as_str) == Some(hash) => {
                return FileCreateResult::AlreadyUploaded {  };
            },
            Some(o) => {
                return FileCreateResult::NameInUse {
                    file_hash: o.md5_hash.unwrap_or_default(),
                };
            },
            None => (),
        }

        self.client.upload_object(&UploadObjectRequest {
            bucket: self.bucket_name.to_string(),
            ..Default::default()
        }, vec![], &UploadType::Simple(Media {
            name: name.to_string().into(),
            content_type: mime_type.to_string().into(),
            content_length: Some(0),
        })).await.expect("Could not create object");
        let upload_url = self.client.signed_url(
            &self.bucket_name,
            &name,
            None, None, SignedURLOptions {
                method: SignedURLMethod::PUT,
                expires: Duration::from_secs(86400),
                content_type: Some(mime_type.to_string()),
                // md5: Some(hash.to_string()),
                ..Default::default()
            },
        ).await.expect("Could not create upload url");

        FileCreateResult::Success { upload_url  }
    }
}
