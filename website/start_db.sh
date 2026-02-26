#!/bin/nu

(
  sudo docker run --network host
  --rm --name some-postgres
  -v heav_faxer_postgresql:/var/lib/postgresql
  -e POSTGRES_PASSWORD=postgres pguuidv7
)
