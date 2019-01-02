# Build MozJPEG in a separate container.
FROM alpine:3.7 as mozjpeg-builder
RUN apk --update add autoconf automake build-base curl libtool nasm

ENV MOZJPEG_VERSION 3.2
RUN mkdir -p /build/ \
    && curl -sSL https://github.com/mozilla/mozjpeg/archive/v$MOZJPEG_VERSION.tar.gz | tar xzC /build/
RUN cd /build/mozjpeg-$MOZJPEG_VERSION \
    && autoreconf -fiv && ./configure --prefix=/opt/mozjpeg && make install

# Finally build deployable image.
FROM alpine:3.7

ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8

RUN apk --no-cache add tzdata && \
    cp /usr/share/zoneinfo/Etc/UTC /etc/localtime && \
    echo "UTC" | tee /etc/timezone && \
    apk del tzdata

RUN apk add --no-cache \
    curl make \
    imagemagick pngquant
COPY --from=mozjpeg-builder /opt/mozjpeg /opt/mozjpeg
ENV PATH=/opt/mozjpeg/bin:$PATH

RUN apk --no-cache add \
    php7 php7-opcache php7-fpm php7-cgi php7-ctype php7-json php7-dom php7-zip php7-zip php7-imagick \
    php7-curl php7-mbstring php7-redis php7-mcrypt php7-iconv php7-posix php7-pdo_mysql php7-tokenizer php7-simplexml php7-session \
    php7-xml php7-sockets php7-openssl php7-fileinfo php7-ldap php7-exif php7-pcntl php7-xmlwriter php7-phar php7-zlib \
    php7-intl

# Install Composer.
RUN curl -sS https://getcomposer.org/installer | php \
  && mv composer.phar /usr/bin/composer \
  && composer global require hirak/prestissimo --no-plugins --no-scripts \
  && mkdir -p /srv/image-service

# Define application run directory.
WORKDIR /srv/image-service

# Install vendor via Composer.
COPY composer.json ./
COPY composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader

# Add application.
COPY ./ ./

# Define Symfony environment and create autoloader.
ENV SYMFONY_ENV prod
ENV PORT 8000
ENV DEBUG 0
RUN composer dump-autoload --optimize \
  && composer run-script post-install-cmd

# Begin application
CMD make start PORT=$PORT DEBUG=$DEBUG ENV=$SYMFONY_ENV
