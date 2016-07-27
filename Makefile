PORT := 8080
BIND := 0.0.0.0
ENV := prod
DEBUG := 1

start:
	./vendor/bin/ppm start --port=$(PORT) --debug=$(DEBUG) --app-env=$(ENV) --host=$(BIND)

start-dev:
	./vendor/bin/ppm start --debug=1 --app-env=dev --host=127.0.0.1 --port=$(PORT)

test:
	./vendor/bin/phpunit -c phpunit.xml
