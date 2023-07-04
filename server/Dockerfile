FROM rust:alpine AS build

RUN apk add build-base
RUN rustup default nightly

WORKDIR /build

RUN cargo init --name other
COPY Cargo.* .
RUN cargo build --release
RUN rm -rf target/release/server*
COPY . .
RUN cargo build --release

FROM alpine:3.18 AS prod

WORKDIR /workdir
COPY --from=build /build/target/release/server ./server
CMD ["/workdir/server"]
