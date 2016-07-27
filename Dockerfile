FROM php:7-alpine

MAINTAINER Alex Wilson <a@ax.gy>

ENV MOZJPEG_VERSION 3.1
ENV PNGQUANT_VERSION 2.7.1

ENV PORT 8080

# Install mozjpeg
RUN apk --update add autoconf automake build-base libtool nasm curl libpng libpng-dev imagemagick-dev \
  && docker-php-ext-install gd pcntl exif \
  && pecl install imagick \
  && docker-php-ext-enable imagick \
  && curl -sS https://getcomposer.org/installer | php \
  && mv composer.phar /usr/bin/composer \
  && rm -rf /var/cache/apk/*

ADD . /srv/image-service
WORKDIR /srv/image-service

RUN sh ./build/install-mozjpeg.sh \
    && sh ./build/install-pngquant.sh \

RUN composer install -o

CMD ["make", "start"]
