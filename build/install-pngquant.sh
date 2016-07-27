#!/bin/sh

# Installs pngquant.

curl -sSL https://github.com/pornel/pngquant/archive/$PNGQUANT_VERSION.tar.gz | tar xzC /build/
cd /build/pngquant-$PNGQUANT_VERSION ; ./configure --prefix=/usr
make -C /build/pngquant-$PNGQUANT_VERSION
make -C /build/pngquant-$PNGQUANT_VERSION install

