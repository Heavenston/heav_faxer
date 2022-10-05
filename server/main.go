package main

import (
    "fmt"
    "log"
    "net/http"

    "fr.faxer/apiserver/links"
    "fr.faxer/apiserver/db"
)

func cors_middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Add("Access-Control-Allow-Origin", "*")
        if r.Method == "OPTIONS" { // ignore preflight
            return
        }

        next.ServeHTTP(w, r)
    })
}

func main() {
    err := db.Connect()
    if err != nil {
        log.Fatal("Could not connect")
    }
    defer db.Disonnect()
    fmt.Println("Succesfully connected to database")

    http.Handle("/link/", cors_middleware(http.HandlerFunc(links.LinkHandlr)))
    http.Handle("/api/link/", cors_middleware(http.HandlerFunc(links.LinkHandlr)))
    log.Fatal(http.ListenAndServe(":8080", nil))
}
