use std::net::IpAddr;

use rocket::{request::{FromRequest, self}, Request};

pub struct RealIp(pub Option<IpAddr>);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RealIp {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        request::Outcome::Success(RealIp(req.client_ip()))
    }
}