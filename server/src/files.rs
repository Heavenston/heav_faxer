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
    UknownLocation,
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
    // pub const UPLOAD_URL_DURATION: Duration =
    //     Duration::from_secs(10800 /* 3 Hours */);
    pub const UPLOAD_URL_DURATION: Duration =
        Duration::from_secs(60 /* 3 Hours */);

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
        &self, file_name: &str
    ) -> db::FileLocation {
        db::FileLocation::Gcs {
            bucket_name: self.bucket_name.clone(),
            file_name: self.subpath.to_string() + file_name,
        }
    }

    pub async fn read_file(
        &self, location: &db::FileLocation,
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

                Some(FileInfo {
                    real_hash: object.md5_hash,
                    mime_type: object.content_type,
                    size: object.size.max(0).try_into().unwrap(),
                    location: location.clone(),
                })
            },
            db::FileLocation::Other => None,
        }
    }

    pub async fn create_file(
        &self,
        location: &db::FileLocation,
        mime_type: &str,
        hash: &str,
    ) -> FileCreateResult {
        let db::FileLocation::Gcs { bucket_name, file_name } = location
            else { return FileCreateResult::UknownLocation };

        self.client.upload_object(&UploadObjectRequest {
            bucket: self.bucket_name.to_string(),
            ..Default::default()
        }, vec![], &UploadType::Simple(Media {
            name: file_name.to_string().into(),
            content_type: mime_type.to_string().into(),
            content_length: Some(0),
        })).await.expect("Could not create object");
        let upload_url = self.client.signed_url(
            &bucket_name,
            &file_name,
            None, None, SignedURLOptions {
                method: SignedURLMethod::PUT,
                expires: Self::UPLOAD_URL_DURATION,
                content_type: Some(mime_type.to_string()),
                md5: Some(hash.to_string()),
                ..Default::default()
            },
        ).await.expect("Could not create upload url");

        FileCreateResult::Success { upload_url }
    }
}
