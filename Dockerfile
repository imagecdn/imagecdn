FROM golang:alpine as builder

MAINTAINER Alex Wilson <a@ax.gy>

RUN apk update ; apk add \
    git \
    imagemagick \
    imagemagick-dev \
    libpng-dev \
    pkgconfig \
    build-base

RUN go get -u github.com/golang/dep/cmd/dep

RUN mkdir -p /go/src/github.com/antoligy/responsive-image-service && \
    mkdir -p /app/
WORKDIR /go/src/github.com/antoligy/responsive-image-service

COPY Gopkg.toml Gopkg.lock ./
RUN dep ensure -vendor-only

ADD ./ ./
RUN go build -o /app/main .

CMD ["/app/main"]
