package main

import (
    "fmt"
    "log"
    "net/http"

    "fr.faxer/apiserver/links"
    "fr.faxer/apiserver/db"
)


func main() {
    err := db.Connect()
    if err != nil {
        log.Fatal("Could not connect")
    }
    defer db.Disonnect()
    fmt.Println("Succesfully connected to database")

    http.HandleFunc("/link/", links.LinkHandlr)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
