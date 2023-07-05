FROM rust:alpine AS cuisine
WORKDIR /workdir

RUN apk add build-base
RUN rustup default nightly
RUN cargo install cargo-chef

FROM cuisine AS planning

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM cuisine AS build

COPY --from=planning /workdir/recipe.json ./recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release

FROM alpine:3.18 AS prod
WORKDIR /workdir

COPY --from=build /workdir/target/release/server ./server
CMD ["/workdir/server"]
