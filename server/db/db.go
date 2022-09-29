package db;

import (
    "fmt"
    "context"

    "cloud.google.com/go/firestore"
    "google.golang.org/api/iterator"
)

type Link struct {
    Key string    `firestore:"key"`;
    Target string `firestore:"target"`;
}
var FirestoreClient *firestore.Client = nil;

func Connect() error {
    ctx := context.Background()

    var err error
    FirestoreClient, err = firestore.NewClient(ctx, "heav-faxer-311216")
    return err;
}

func Disonnect() {
    FirestoreClient.Close()
}

func LinksCollection() *firestore.CollectionRef {
    return FirestoreClient.Collection("links")
}

func GetLinkTarget(key string) *string {
    collection := FirestoreClient.Collection("links")
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
