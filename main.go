package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/mux"
)

func main() {

	router := mux.NewRouter().StrictSlash(true).UseEncodedPath()
	router.HandleFunc("/", indexAction)
	router.HandleFunc("/v2/images/{source}", imageAction)
	log.Fatal(http.ListenAndServe(":8080", router))
}

func indexAction(res http.ResponseWriter, req *http.Request) {
	res.WriteHeader(http.StatusOK)
}

func imageAction(res http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)
	source, _ := url.QueryUnescape(params["source"])

	httpClient := &http.Client{
		Timeout: time.Second * 30,
	}

	sourceResponse, err := httpClient.Get(source)
	if err != nil {
		res.WriteHeader(sourceResponse.StatusCode)
	}
	defer sourceResponse.Body.Close()

	res.WriteHeader(http.StatusOK)
	io.Copy(res, sourceResponse.Body)
}