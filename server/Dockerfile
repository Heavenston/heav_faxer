FROM rust:alpine AS build

RUN apk add build-base
RUN rustup default nightly

WORKDIR /build

COPY . .
RUN cargo build --release

FROM alpine:3.18 AS prod

WORKDIR /workdir
COPY --from=build /build/target/release/server ./server
CMD ["/workdir/server"]
