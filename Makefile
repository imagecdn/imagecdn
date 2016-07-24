start:
	./vendor/bin/ppm start

start-dev:
	./vendor/bin/ppm start --debug=1

test:
	./vendor/bin/phpunit -c phpunit.xml
