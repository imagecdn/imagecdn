package main

import (
	// "os"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	// "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gopkg.in/gographics/imagick.v3/imagick"
)

func main() {

	router := mux.NewRouter().StrictSlash(true).UseEncodedPath()
	router.HandleFunc("/", indexAction)
	router.HandleFunc("/v2/images/{source}", imageAction)
	// loggedRouter := handlers.LoggingHandler(os.Stdout, router)
	log.Fatal(http.ListenAndServe(":8080", router))
}

func indexAction(res http.ResponseWriter, req *http.Request) {
	res.WriteHeader(http.StatusOK)
}


func imageAction(res http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)
	source, _ := url.QueryUnescape(params["source"])

    imagick.Initialize()
    defer imagick.Terminate()

	httpClient := &http.Client{
		Timeout: time.Second * 30,
	}

	sourceResponse, err := httpClient.Get(source)
	if err != nil {
		res.WriteHeader(sourceResponse.StatusCode)
	}
	defer sourceResponse.Body.Close()
	sourceObject, _ := ioutil.ReadAll(sourceResponse.Body)

    mw := imagick.NewMagickWand()
	defer mw.Destroy()

	mw.ReadImageBlob(sourceObject)

	formatImage(res, req, mw)
	resizeImage(res, req, mw)

	img := mw.GetImageBlob()
	res.WriteHeader(http.StatusOK)

	res.Header().Set("Content-Length", strconv.Itoa(len(img)))

	res.Write(img)
}

func resizeImage(res http.ResponseWriter, req *http.Request, mw *imagick.MagickWand) {
	var height, width uint
	queryString := req.URL.Query()

	heights, heightOk := queryString["height"]
	widths, widthOk := queryString["width"]

	if (!heightOk && !widthOk) {
		return
	}

	// Assume no fill, yet.
	if (heightOk && len(heights) > 0) {
		IHeight, _ := strconv.Atoi(heights[0])
		height = uint(IHeight)
	} else {
		height = mw.GetImageHeight()
	}
	if (widthOk && len(widths) > 0) {
		IWidth, _ := strconv.Atoi(widths[0])
		width = uint(IWidth)
	} else {
		width = mw.GetImageWidth()
	}

	mw.ResizeImage(width, height, imagick.FILTER_LANCZOS)
}

func formatImage(res http.ResponseWriter, req *http.Request, mw *imagick.MagickWand) {
	queryString := req.URL.Query()
	imageFormats, ok := queryString["format"]

	if (!ok || len(imageFormats) == 0) {
		return
	}

	imageFormat := imageFormats[0]

	var imageFormatMap = map[string]string{
		"jpg": "image/jpg",
		"png": "image/png",
		"webp": "image/webp",
		"svg": "image/svg",
		"gif": "image/gif",
	}

	mw.SetFormat(imageFormat)

	res.Header().Set("Content-Type", imageFormatMap[imageFormat])

	return
}