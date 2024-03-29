use std::{net::IpAddr, time::{SystemTime, Duration}};

use bson::Timestamp;
use rocket::{request::{FromRequest, self}, Request};

pub struct RealIp(pub Option<IpAddr>);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RealIp {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        if let Some(h) = req.headers().get("X-Forwarded-For").next() {
            h.split(',').next().and_then(|x| x.parse::<IpAddr>().ok())
                .map(|x| request::Outcome::Success(RealIp(Some(
                    x
                ))))
                .unwrap_or(request::Outcome::Success(RealIp(req.client_ip())))
        }
        else {
            request::Outcome::Success(RealIp(req.client_ip()))
        }
    }
}

pub fn timestamp_to_time(g: &Timestamp) -> SystemTime {
    SystemTime::UNIX_EPOCH + Duration::from_secs(g.time.into())
}