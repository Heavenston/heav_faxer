package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"golang.org/x/exp/slices"
	"google.golang.org/api/iterator"
)

var FirestoreClient *firestore.Client = nil;

func Connect() error {
    ctx := context.Background()

    var err error
    FirestoreClient, err = firestore.NewClient(ctx, firestore.DetectProjectID)
    return err;
}

func Disonnect() {
    FirestoreClient.Close()
}

type LinkData struct {
    Target string `firestore:"target"`;
}

func LinksCollection() *firestore.CollectionRef {
    return FirestoreClient.Collection("links")
}
func GetLinkTarget(key string) *string {
    ctx := context.Background()

    collection := LinksCollection()
    doc := collection.Doc(key)
    docSnap, err := doc.Get(ctx)

    if docSnap == nil {
        fmt.Errorf("Could not fetch a document:", err)
        return nil
    }
    if !docSnap.Exists() {
        return nil
    }

    var link LinkData
    if err := docSnap.DataTo(&link); err != nil {
        fmt.Errorf("Invalid document in link collection:", err)
        return nil
    }
    return &link.Target
}
func TryInsertTarget(key string, target string) bool {
    ctx := context.Background()

    collection := LinksCollection()
    doc := collection.Doc(key)
    _, err := doc.Create(ctx, LinkData {
        Target: target,
    })

    if err != nil {
        fmt.Errorf("No:", err)
        return false
    }

    return true
}

type UserData struct {
    State string `firestore:"state"`
    Addrs []string `firestore:"addrs"`
    LastCreate *firestore.DocumentRef `firestore:"last-create"`
    LastSuccessfulCreate *firestore.DocumentRef `firestore:"last-successful-create"`
    LastRead *firestore.DocumentRef `firestore:"last-read"`
    LastSuccessfulRead *firestore.DocumentRef `firestore:"last-successful-create"`
}

type MergedUserData struct {
    State string `firestore:"state"`
    MergedTo *firestore.DocumentRef `firestore:"merged-to"`
}

type UserInteraction struct {
    Type string `firestore:"type"`
    Success bool `firestore:"success"`
    Link string `firestore:"link"`
    Date time.Time `firestore:"date"`
}

type UserRef struct {
    usedAddr string
    id string
    data UserData
}

func UsersCollection() *firestore.CollectionRef {
    return FirestoreClient.Collection("users")
}

func ResolveUserRef(addr string, id *string) UserRef {
    ctx := context.Background()
    collection := UsersCollection()

    var idSnap *firestore.DocumentSnapshot = nil
    var idData UserData
    // Try to get the "id" document
    if id != nil {
        idRef := collection.Doc(*id)
        for {
            var err error = nil
            idSnap, err = idRef.Get(ctx)
            if err != nil && idSnap == nil {
                fmt.Errorf("Could not fetch doc:", err)
            }

            if idSnap != nil {
                if err := idSnap.DataTo(&idData); err != nil {
                    log.Fatal()
                }

                state, _ := idSnap.DataAt("state")
                if state == "merged" {
                    mergedTo, _ := idSnap.DataAt("merged-to")
                    idRef = collection.Doc(mergedTo.(string))
                } else { break }
            } else { break }
        }
    }

    // Note: Possible race condition leading to multiple documents for a single user
    // shouldn't generate any vulnerabilites nor major bugs

    // If there is no id doc or it does not contain the given address
    // we need to merge (or create) the id doc
    if idSnap == nil || !slices.Contains(idData.Addrs, addr) {
        docs := collection.Where("addrs", "array-contains", addr).Limit(1).Documents(ctx)
        addrMatch, err := docs.Next()

        if err != nil && err != iterator.Done {
            fmt.Errorf("Could not fetch doc:", err)
        }

        if idSnap == nil { // No id match
            if addrMatch == nil { // The user doc needs to be created
                data := UserData {
                    State: "normal",
                    Addrs: []string{ addr },
                    LastCreate: nil,
                    LastRead: nil,
                }
                idRef := collection.NewDoc()
                _, err := idRef.Create(ctx, data)
                if err != nil {
                    log.Fatal("Could not create user doc", err)
                }
                return UserRef {
                    usedAddr: addr,
                    id: idRef.ID,
                    data: data,
                }
            } else { // The user doc is addrMatch
                var data UserData
                if err := addrMatch.DataTo(&data); err != nil {
                    log.Fatal()
                }
                return UserRef {
                    usedAddr: addr,
                    id: addrMatch.Ref.ID,
                    data: data,
                }
            }
        } else { // There is an id match
            if addrMatch == nil { // The used addr must be added to the id doc
                _, err := idSnap.Ref.Update(
                    ctx,
                    []firestore.Update{{ Path: "addrs", Value: firestore.ArrayUnion(addr) }},
                )
                if err != nil {
                    log.Fatal("Could not update user doc", err)
                }
                var data UserData
                idSnap.DataTo(&data)
                data.Addrs = append(data.Addrs, addr) // Local copy isn't updated

                return UserRef {
                    usedAddr: addr,
                    id: idSnap.Ref.ID,
                    data: data,
                }
            } else { // The two docs must be merged together
                var addrMatchData UserData
                err := addrMatch.DataTo(&addrMatchData)
                if err != nil {
                    log.Fatal("Could not update user doc", err)
                }

                otherAddrs := make([]any, 0, len(addrMatchData.Addrs))
                for i, v := range addrMatchData.Addrs {
                    otherAddrs[i] = v
                }
                
                // Merging into idSnap
                batch := FirestoreClient.Batch().
                    Set(addrMatch.Ref, MergedUserData {
                        State: "merged",
                        MergedTo: idSnap.Ref,
                    }).
                    Update(idSnap.Ref, []firestore.Update{
                        { Path: "addrs", Value: firestore.ArrayUnion(otherAddrs...) },
                    })

                // Moving interactions
                interactionIter := addrMatch.Ref.Collection("interactions").Documents(ctx)
                for {
                    doc, err := interactionIter.Next()
                    if err == iterator.Done { break }
                    if err != nil {
                        log.Fatal("Iterator error")
                    }
                    batch.
                        Delete(doc.Ref).
                        Create(idSnap.Ref.Collection("interactions").Doc(doc.Ref.ID), doc.Data)
                }

                interactionIter.Stop()
                if err != nil {
                    log.Fatal("Iterator error")
                }

                var data UserData
                idSnap.DataTo(&data)

                // Local data wasn't updated
                for _, v := range addrMatchData.Addrs {
                    data.Addrs = append(data.Addrs, v)
                }

                return UserRef {
                    usedAddr: addr,
                    id: addrMatch.Ref.ID,
                    data: data,
                }
            }
        }
    }

    var data UserData
    idSnap.DataTo(&data)

    return UserRef {
        usedAddr: addr,
        id: idSnap.Ref.ID,
        data: data,
    }
}

func (user *UserRef) LastCreate() *UserInteraction {
    if user.data.LastCreate == nil { return nil }
    lastCreateSnap, err := user.data.LastCreate.Get(context.Background())
    if err != nil {
        log.Fatal("Could not fetch last create: ", err)
    }
    var lastCreateData UserInteraction
    lastCreateSnap.DataTo(&lastCreateData)
    if err != nil {
        log.Fatal(err)
    }
    return &lastCreateData
}
func (user *UserRef) LastSuccessfulCreate() *UserInteraction {
    if user.data.LastCreate == nil { return nil }
    lastCreateSnap, err := user.data.LastSuccessfulCreate.Get(context.Background())
    if err != nil {
        log.Fatal("Could not fetch last create: ", err)
    }
    var lastCreateData UserInteraction
    lastCreateSnap.DataTo(&lastCreateData)
    if err != nil {
        log.Fatal(err)
    }
    return &lastCreateData
}
func (user *UserRef) LastRead() *UserInteraction {
    if user.data.LastCreate == nil { return nil }
    lastReadSnap, err := user.data.LastRead.Get(context.Background())
    if err != nil {
        log.Fatal("Could not fetch last read: ", err)
    }
    var lastReadData UserInteraction
    lastReadSnap.DataTo(&lastReadData)
    if err != nil {
        log.Fatal(err)
    }
    return &lastReadData
}
func (user *UserRef) LastSuccessfulRead() *UserInteraction {
    if user.data.LastCreate == nil { return nil }
    lastReadSnap, err := user.data.LastSuccessfulRead.Get(context.Background())
    if err != nil {
        log.Fatal("Could not fetch last read: ", err)
    }
    var lastReadData UserInteraction
    lastReadSnap.DataTo(&lastReadData)
    if err != nil {
        log.Fatal(err)
    }
    return &lastReadData
}

func (user *UserRef) addInteractionAsLast(newInt UserInteraction) {
    userRef := UsersCollection().Doc(user.id)
    interactions := userRef.Collection("interactions")

    var lastType string
    var lastSuccessfulType string
    if newInt.Type == "create" {
        lastType = "last-create"
        lastSuccessfulType = "last-successful-create"
    } else if newInt.Type == "read" {
        lastType = "last-read"
        lastSuccessfulType = "last-successful-create"
    } else {
        log.Fatal("Invalid user interaction type")
    }

    newIntRef := interactions.NewDoc()

    fieldUpdates := make([]firestore.Update, 0, 2)
    fieldUpdates = append(fieldUpdates, firestore.Update{ Path: lastType, Value: newIntRef })
    if newInt.Success {
        fieldUpdates = append(fieldUpdates, firestore.Update{ Path: lastSuccessfulType, Value: newIntRef })
    }

    _, err := FirestoreClient.Batch().
        Create(newIntRef, newInt).
        Update(userRef, fieldUpdates).
        Commit(context.Background())
    if err != nil {
        log.Fatal("Batch fail", err)
    }
}
func (user *UserRef) AddReadInteraction(link string, success bool) {
    user.addInteractionAsLast(UserInteraction {
        Type: "read",
        Success: success,
        Link: link,
        Date: time.Now(),
    })
}
func (user *UserRef) AddCreateInteraction(link string, success bool) {
    user.addInteractionAsLast(UserInteraction {
        Type: "create",
        Success: success,
        Link: link,
        Date: time.Now(),
    })
}
