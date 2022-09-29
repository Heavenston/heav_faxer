FROM golang:1.19-alpine AS build

WORKDIR /build/sources

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . ./
RUN go build -v -o /build/apiserver ./

FROM alpine:3.16 AS prod

WORKDIR /workdir
COPY --from=build /build/apiserver ./apiserver
CMD ["/workdir/apiserver"]
