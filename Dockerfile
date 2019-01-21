FROM node:10

# Define application run directory.
WORKDIR /srv/image-service

# Install vendor via Composer.
COPY package*.json ./
RUN npm install

# Add application.
COPY ./ ./

# Begin application
CMD make start PORT=$PORT DEBUG=$DEBUG ENV=$SYMFONY_ENV
