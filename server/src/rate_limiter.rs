use std::{net::IpAddr, time::{Instant, Duration}, collections::HashMap, sync::{RwLock, Mutex, Arc}};

use rocket::{request::{FromRequest, self}, http::Status};

pub struct RateLimitedLocalCache {
    pub until: Instant,
}

enum HostState {
    Monitoring {
        last_requests: Vec<Instant>,
    },
    Blocked {
        until: Instant,
    }
}

impl Default for HostState {
    fn default() -> Self {
        Self::Monitoring { last_requests: vec![] }
    }
}

type Hosts = Arc<RwLock<HashMap<&'static str, RwLock<HashMap<
    IpAddr,
    Arc<Mutex<Option<HostState>>>
>>>>>;
pub struct RateLimitState {
    hosts: Hosts,
}

impl RateLimitState {
    pub fn new() -> Self {
        let h: Hosts = Default::default();
        let hosts = Arc::clone(&h);
        // Granage collector
        tokio::spawn(async move {
            let mut int = tokio::time::interval(Duration::from_secs(30));
            loop {
                int.tick().await;
                let endpoints = h.write().unwrap();
                for endpoint in endpoints.values() {
                    let mut ed = endpoint.write().unwrap();
                    ed.drain_filter(|_, v| {
                        let mut p = v.lock().unwrap();
                        let e = p.take().unwrap_or_default();
                        let ne = match e {
                            HostState::Monitoring { last_requests } => {
                                let last_ten_minutes: Vec<_> = last_requests.into_iter()
                                    .filter(|i| i.elapsed() < Duration::from_secs(60 * 10))
                                    .collect();

                                HostState::Monitoring {
                                    last_requests: last_ten_minutes
                                }
                            }
                            HostState::Blocked { until } if until.saturating_duration_since(Instant::now()) <= Duration::ZERO
                                => Default::default(),

                            b => b,
                        };
                        let delete = matches!(
                            &ne,
                            HostState::Monitoring {
                                last_requests
                            } if last_requests.len() == 0
                        );
                        *p = Some(ne);
                        delete
                    }).for_each(|(k, _)| println!("Delete {k:?}"));
                }
            }
        });
        Self {
            hosts,
        }
    }

    fn get_host_state(
        &self, endpoint_name: &'static str, client_ip: IpAddr
    ) -> Arc<Mutex<Option<HostState>>> {
        let mut r = self.hosts.read().unwrap();
        let endpoint_store = match r.get(endpoint_name) {
            Some(x) => x,
            None => {
                drop(r);
                self.hosts.write().unwrap().insert(endpoint_name, Default::default());
                r = self.hosts.read().unwrap();
                r.get(endpoint_name).unwrap()
            }
        };
        
        let mut er = endpoint_store.read().unwrap();
        let last = match er.get(&client_ip) {
            Some(x) => x,
            None => {
                drop(er);
                endpoint_store.write().unwrap().insert(
                    client_ip.clone(), Default::default()
                );
                er = endpoint_store.read().unwrap();
                er.get(&client_ip).unwrap()
            }
        };
        Arc::clone(last)
    }
}

pub struct RateLimited<const NAME: &'static str, const MAX_REQ_PER_TEN_MINS: usize>;

#[rocket::async_trait]
impl<
    const NAME: &'static str,
    const MAX_REQ_PER_TEN_MINS: usize,
    'r
> FromRequest<'r> for RateLimited<NAME, MAX_REQ_PER_TEN_MINS> {
    type Error = ();

    async fn from_request(
        request: &'r rocket::Request<'_>
    ) -> request::Outcome<Self, Self::Error> {
        let Some(client_ip) = request.client_ip()
            else {
                return request::Outcome::Success(Self);
            };

        let global_state: &RateLimitState = request.rocket().state().unwrap();
        let host_state = global_state.get_host_state(
            NAME, client_ip
        );
        let mut host_state = host_state.lock().unwrap();

        let new_state = match host_state.take().unwrap_or_default() {
            HostState::Monitoring { last_requests } => {
                let mut last_ten_minutes: Vec<_> = last_requests.into_iter()
                    .filter(|i| i.elapsed() < Duration::from_secs(60 * 10))
                    .collect();
                last_ten_minutes.push(Instant::now());
                if last_ten_minutes.len() > MAX_REQ_PER_TEN_MINS {
                    HostState::Blocked {
                        until: Instant::now() + Duration::from_secs(60 * 10)
                    }
                }
                else {
                    HostState::Monitoring { last_requests: last_ten_minutes }
                }
            },
            HostState::Blocked { until } if until.saturating_duration_since(Instant::now()) <= Duration::ZERO => {
                HostState::Monitoring { last_requests: vec![Instant::now()] }
            }

            state => state,
        };

        let rs =
            if let HostState::Blocked { until } = new_state {
                request.local_cache(|| Some(RateLimitedLocalCache {
                    until
                }));
                request::Outcome::Failure((
                    Status::TooManyRequests,
                    ()
                ))
            }
            else {
                request::Outcome::Success(Self)
            };
        *host_state = Some(new_state);
        rs
    }
}
