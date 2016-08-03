FROM alpine:3.4
#FROM php:7.0.9-alpine

MAINTAINER Alex Wilson <a@ax.gy>

ENV MOZJPEG_VERSION 3.1
ENV PNGQUANT_VERSION 2.7.1

ENV PORT 8000
ENV PHP_EXTRA_CONFIGURE_ARGS --enable-cgi

## <From docker-library/php> ##
# persistent / runtime deps
ENV PHPIZE_DEPS \
		autoconf \
		automake \
		build-base \
		file \
		g++ \
		gcc \
		libc-dev \
		libtool \
		make \
		nasm \
		pkgconf \
		re2c
RUN apk add --no-cache --virtual .persistent-deps \
		make \
		ca-certificates \
		curl \
		tar \
		xz

# ensure www-data user exists
RUN set -x \
	&& addgroup -g 82 -S www-data \
	&& adduser -u 82 -D -S -G www-data www-data
# 82 is the standard uid/gid for "www-data" in Alpine
# http://git.alpinelinux.org/cgit/aports/tree/main/apache2/apache2.pre-install?h=v3.3.2
# http://git.alpinelinux.org/cgit/aports/tree/main/lighttpd/lighttpd.pre-install?h=v3.3.2
# http://git.alpinelinux.org/cgit/aports/tree/main/nginx-initscripts/nginx-initscripts.pre-install?h=v3.3.2

ENV PHP_INI_DIR /usr/local/etc/php
RUN mkdir -p $PHP_INI_DIR/conf.d

ENV GPG_KEYS 1A4E8B7277C42E53DBA9C7B9BCAA30EA9C0D5763

ENV PHP_VERSION 7.0.9
ENV PHP_FILENAME php-7.0.9.tar.xz
ENV PHP_SHA256 970c322ba3e472cb0264b8ba9d4d92e87918da5d0cca53c4aba2a70545b8626d

RUN set -xe \
	&& apk add --no-cache --virtual .fetch-deps \
		gnupg \
	&& mkdir -p /usr/src \
	&& cd /usr/src/ \
	&& curl -fSL "http://php.net/get/$PHP_FILENAME/from/this/mirror" -o php.tar.xz \
	&& echo "$PHP_SHA256 *php.tar.xz" | sha256sum -c - \
	&& curl -fSL "http://php.net/get/$PHP_FILENAME.asc/from/this/mirror" -o php.tar.xz.asc \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& for key in $GPG_KEYS; do \
		gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
	done \
	&& gpg --batch --verify php.tar.xz.asc php.tar.xz \
	&& rm -r "$GNUPGHOME" \
	&& apk del .fetch-deps

COPY scripts/* /usr/local/bin/

RUN set -xe \
	&& apk add --no-cache --virtual .build-deps \
		$PHPIZE_DEPS \
		curl-dev \
		libedit-dev \
		libxml2-dev \
		openssl-dev \
		sqlite-dev \
	&& docker-php-source extract \
	&& cd /usr/src/php \
	&& ./configure \
		--with-config-file-path="$PHP_INI_DIR" \
		--with-config-file-scan-dir="$PHP_INI_DIR/conf.d" \
		--enable-cgi \
# --enable-mysqlnd is included here because it's harder to compile after the fact than extensions are (since it's a plugin for several extensions, not an extension in itself)
		--enable-mysqlnd \
# --enable-mbstring is included here because otherwise there's no way to get pecl to use it properly (see https://github.com/docker-library/php/issues/195)
		--enable-mbstring \
		--with-curl \
		--with-libedit \
		--with-openssl \
		--with-zlib \
		$PHP_EXTRA_CONFIGURE_ARGS \
	&& make -j"$(getconf _NPROCESSORS_ONLN)" \
	&& make install \
	&& { find /usr/local/bin /usr/local/sbin -type f -perm +0111 -exec strip --strip-all '{}' + || true; } \
	&& make clean \
	&& runDeps="$( \
		scanelf --needed --nobanner --recursive /usr/local \
			| awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
			| sort -u \
			| xargs -r apk info --installed \
			| sort -u \
	)" \
        && docker-php-ext-install pcntl exif \
        && apk add --no-cache \
                imagemagick-dev \
                libpng-dev \
                libpng \
        && pecl install imagick \
        && docker-php-ext-enable imagick \
	&& apk add --no-cache --virtual .php-rundeps $runDeps \
        && install-mozjpeg \
        && install-pngquant \
        && apk del .build-deps \
	&& docker-php-source delete

RUN curl -sS https://getcomposer.org/installer | php \
  && mv composer.phar /usr/bin/composer

ADD . /srv/image-service
WORKDIR /srv/image-service

ENV SYMFONY_ENV prod
RUN composer install -o

CMD make start PORT=$PORT
