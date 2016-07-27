#!/bin/sh

# Installs mozjpeg

mkdir -p /build/mozjpeg
curl -sSL https://github.com/mozilla/mozjpeg/archive/v$MOZJPEG_VERSION.tar.gz | tar xzC /build/
autoreconf -fiv /build/mozjpeg-$MOZJPEG_VERSION
cd /build/mozjpeg-$MOZJPEG_VERSION ; ./configure
make -C /build/mozjpeg-$MOZJPEG_VERSION install prefix=/usr/local libdir=/usr/local/lib64
