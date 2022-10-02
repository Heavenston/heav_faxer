package links

import (
	"encoding/json"
	"fmt"
	"net/http"
    "net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"fr.faxer/apiserver/db"
)

type linkPostRequest struct {
    Target string `json:"target"`
}

var path_reg = regexp.MustCompile("^(?:/api)?/(link)/([A-Za-z0-9]+)/?$")
var successfulCreateTimeout = time.Minute
var unsuccessfulCreateTimeout = time.Second * 2

func LinkHandlr(w http.ResponseWriter, r *http.Request) {
    path := path_reg.FindStringSubmatch(r.URL.Path)
    if (path == nil) {
        w.WriteHeader(http.StatusNotFound)
        return;
    }

    var remoteAddr string = r.Header.Get("X-Forwarded-For")
    if remoteAddr == "" {
        splitted := strings.Split(r.RemoteAddr, ":")
        remoteAddr = strings.Join(splitted[:len(splitted)-1], ":")
    }

    identifierCookie, _ := r.Cookie("identifier")
    var identifier *string = nil
    if identifierCookie != nil { identifier = &identifierCookie.Value }
    userRef := db.ResolveUserRef(remoteAddr, identifier)

    w.Header().Add("Set-Cookie", fmt.Sprintf("identifier=%s", url.QueryEscape(userRef.Id)))

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
        w.Header().Add("Content-Type", "application/json")

        if r.Header.Get("Content-Type") != "application/json" {
            w.WriteHeader(http.StatusBadRequest)
            w.Write([]byte(`{"result": "error", "error": "not_supported_content_type"}`))
            userRef.AddCreateInteraction(path[2], false)
            return
        }

        var req linkPostRequest
        dec := json.NewDecoder(r.Body)
        dec.DisallowUnknownFields()
        err := dec.Decode(&req)
        if err != nil || dec.More() {
            w.WriteHeader(http.StatusBadRequest)
            w.Write([]byte(`{"result": "error", "error": "invalid_payload"}`))
            userRef.AddCreateInteraction(path[2], false)
            return
        }

        lastCreate := userRef.LastSuccessfulCreate()
        if lastCreate != nil && lastCreate.Date.Add(successfulCreateTimeout).After(time.Now()) {
            retryAfter := unsuccessfulCreateTimeout.Milliseconds()

            w.Header().Add("Retry-After", strconv.FormatInt(retryAfter, 10))
            w.WriteHeader(http.StatusTooManyRequests)
            w.Write([]byte(fmt.Sprintf(`{"result": "error", "error": "rate_limit", "retry_after": %d}`, retryAfter)))
            userRef.AddCreateInteraction(path[2], false)
            return
        }
        lastCreate = userRef.LastCreate()
        if lastCreate != nil && lastCreate.Date.Add(unsuccessfulCreateTimeout).After(time.Now()) {
            retryAfter := unsuccessfulCreateTimeout.Milliseconds()

            w.Header().Add("Retry-After", strconv.FormatInt(retryAfter, 10))
            w.WriteHeader(http.StatusTooManyRequests)
            w.Write([]byte(fmt.Sprintf(`{"result": "error", "error": "rate_limit", "retry_after": %d}`, retryAfter)))
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

