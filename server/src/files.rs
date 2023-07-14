use crate::db;

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
    client: cloud_storage::Client,
    bucket: cloud_storage::Bucket,
    storage_bucket_name: String,
    subpath: String,
}

impl FilesManager {
    pub async fn new(
        storage_bucket_name: String,
        subpath: String,
    ) -> Self {
        let client = cloud_storage::Client::new();
        let bucket = client.bucket().read(
            &storage_bucket_name
        ).await.expect("Could not read bucket");

        Self {
            client,
            bucket,
            storage_bucket_name,
            subpath,
        }
    }

    pub fn new_location(
        &self, file_name: impl Into<String>
    ) -> db::FileLocation {
        db::FileLocation::GCS {
            bucket_name: self.bucket.name.clone(),
            file_name: file_name.into(),
        }
    }

    pub async fn read_file(
        &self, location: db::FileLocation,
    ) -> Option<FileInfo> {
        match &location {
            db::FileLocation::GCS {
                bucket_name, file_name
            } => {
                // FIXME: Differenciate errors
                let object = self.client.object().read(
                    &bucket_name, &file_name
                ).await.ok()?;

                Some(FileInfo {
                    real_hash: object.md5_hash,
                    mime_type: object.content_type,
                    size: object.size,
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
        let object = self.client.object()
            .read(&self.bucket.name, name).await.ok();

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

        let new_object = self.client.object().create(
            &self.bucket.name,
            vec![], 
            name,
            mime_type
        ).await.expect("Could not create object");
        let upload_url = new_object.upload_url(86400)
            .expect("Could not create upload url");

        FileCreateResult::Success { upload_url  }
    }
}
