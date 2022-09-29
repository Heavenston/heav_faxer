package main

import (
    "fmt"
    "context"
    "log"
    "net/http"
    "regexp"

    "cloud.google.com/go/firestore"
    "google.golang.org/api/iterator"
)

type Link struct {
    Key string    `firestore:"key"`;
    Target string `firestore:"target"`;
}

var firestore_client *firestore.Client = nil;

func get_link_target(key string) *string {
    collection := firestore_client.Collection("links")
    docs := collection.Where("key", "==", key).Documents(context.Background())

    doc, err := docs.Next()
    if err == iterator.Done {
        return nil
    }

    var link Link
    if err := doc.DataTo(&link); err != nil {
        fmt.Errorf("Invalid document in link collection")
        return nil
    }
    return &link.Target
}

var path_reg = regexp.MustCompile("^/(link)/([A-Za-z0-9]+)$")
func link_handlr(w http.ResponseWriter, r *http.Request) {
    path := path_reg.FindStringSubmatch(r.URL.Path)
    if (path == nil) {
        w.WriteHeader(http.StatusNotFound)
        return;
    }

    target := get_link_target(path[2])
    if target == nil {
        w.Header().Add("Content-Type", "application/json; charset=UTF-8")
        w.WriteHeader(http.StatusNotFound)
        return
    }

    w.Header().Add("Location", *target)
    w.WriteHeader(http.StatusTemporaryRedirect)
}

func main() {
    ctx := context.Background()

    var err error
    firestore_client, err = firestore.NewClient(ctx, "heav-faxer-311216")
    if err != nil {
        log.Fatal("Could not connect")
    }
    defer firestore_client.Close()
    fmt.Println("Succesfully connected")

    http.HandleFunc("/link/", link_handlr)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
