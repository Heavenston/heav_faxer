package links

import (
	"encoding/json"
	"net/http"
	"regexp"
	"time"

	"fr.faxer/apiserver/db"
)

type linkPostRequest struct {
    Target string `json:"target"`
}

var path_reg = regexp.MustCompile("^(?:/api)?/(link)/([A-Za-z0-9]+)$")
var successfulCreateTimeout = time.Minute
var unsuccessfulCreateTimeout = time.Second * 2

func LinkHandlr(w http.ResponseWriter, r *http.Request) {
    path := path_reg.FindStringSubmatch(r.URL.Path)
    if (path == nil) {
        w.WriteHeader(http.StatusNotFound)
        return;
    }

    identifierCookie, _ := r.Cookie("identifier")
    var identifier *string = nil
    if identifierCookie != nil { identifier = &identifierCookie.Value }
    userRef := db.ResolveUserRef(r.RemoteAddr, identifier)

    if (r.Method == "GET") {
        target := db.GetLinkTarget(path[2])
        if target == nil {
            if r.URL.Query().Has("or") {
                w.Header().Add("Location", r.URL.Query().Get("or"))
                w.WriteHeader(http.StatusTemporaryRedirect)
            } else {
                w.Header().Add("Content-Type", "application/json; charset=UTF-8")
                w.WriteHeader(http.StatusNotFound)
            }

            userRef.AddReadInteraction(path[2], false)
            return
        }

        w.Header().Add("Location", *target)
        w.WriteHeader(http.StatusTemporaryRedirect)

        userRef.AddReadInteraction(path[2], true)
    } else if (r.Method == "POST") {
        if r.Header.Get("Content-Type") != "application/json" {
            w.WriteHeader(http.StatusBadRequest)
            return
        }

        var req linkPostRequest
        dec := json.NewDecoder(r.Body)
        dec.DisallowUnknownFields()
        err := dec.Decode(&req)
        if err != nil || dec.More() {
            w.WriteHeader(http.StatusBadRequest)
            userRef.AddCreateInteraction(path[2], false)
            return
        }

        lastCreate := userRef.LastSuccessfulCreate()
        if lastCreate != nil && lastCreate.Date.Add(successfulCreateTimeout).After(time.Now()) {
            w.WriteHeader(http.StatusTooManyRequests)
            userRef.AddCreateInteraction(path[2], false)
            return
        }
        lastCreate = userRef.LastCreate()
        if lastCreate != nil && lastCreate.Date.Add(unsuccessfulCreateTimeout).After(time.Now()) {
            w.WriteHeader(http.StatusTooManyRequests)
            userRef.AddCreateInteraction(path[2], false)
            return
        }

        couldInsert := db.TryInsertTarget(path[2], req.Target)
        if couldInsert {
            w.WriteHeader(http.StatusOK)
        } else {
            w.WriteHeader(http.StatusConflict)
        }
        userRef.AddCreateInteraction(path[2], couldInsert)
    } else {
        w.WriteHeader(http.StatusMethodNotAllowed)
    }
}

