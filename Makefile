PORT := 8080
BIND := 0.0.0.0
ENV := prod
DEBUG := 0

start:
	./bin/ppm start --port=$(PORT) --debug=$(DEBUG) --app-env=$(ENV) --host=$(BIND)

start-dev:
	./bin/ppm start --debug=1 --app-env=dev --host=127.0.0.1 --logging=1 --port=$(PORT)

test:
	./bin/phpunit -c phpunit.xml
