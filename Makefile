PORT := 8080
start:
	./vendor/bin/ppm start --port=$(PORT)

start-dev:
	./vendor/bin/ppm start --debug=1 --app-env=dev --host=127.0.0.1

test:
	./vendor/bin/phpunit -c phpunit.xml
