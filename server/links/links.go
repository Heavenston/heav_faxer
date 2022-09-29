package links;

import (
    "net/http"
    "regexp"

    "fr.faxer/apiserver/db"
)

var path_reg = regexp.MustCompile("^(?:/api)?/(link)/([A-Za-z0-9]+)$")
func LinkHandlr(w http.ResponseWriter, r *http.Request) {
    path := path_reg.FindStringSubmatch(r.URL.Path)
    if (path == nil) {
        w.WriteHeader(http.StatusNotFound)
        return;
    }

    target := db.GetLinkTarget(path[2])
    if target == nil {
        if r.URL.Query().Has("or") {
            w.Header().Add("Location", r.URL.Query().Get("or"))
            w.WriteHeader(http.StatusTemporaryRedirect)
        } else {
            w.Header().Add("Content-Type", "application/json; charset=UTF-8")
            w.WriteHeader(http.StatusNotFound)
        }
        return
    }

    w.Header().Add("Location", *target)
    w.WriteHeader(http.StatusTemporaryRedirect)
}

