# Acceptance tests

These tests send HTTP requests to the image service and examine the responses.
They do not use the code of the service.
Thus, you can use the same tests for the Node.js service and for a rewrite.

## How to run the tests

To run the behaviour tests, use this command:

```
$ npm test
```

To measure the response time and the output size, use this command:

```
$ npm run bench
```

Each test file starts a fixture origin on the loopback address.
Each test file also starts a copy of the service on a free port.

To test a different build, set `SERVICE_CMD` to the command that starts the build:

```
$ SERVICE_CMD=./imagecdn npm test
```

To see the output of the service, set `SERVICE_LOGS=1`.

## Contract with the service

The service must read these environment variables:

| Variable | Meaning |
|---|---|
| `PORT` | The port that the service uses. |
| `IMAGE_RATELIMIT_MAX` | The maximum number of image requests in one window. |
| `IMAGE_RATELIMIT_WINDOW` | The length of the window, in milliseconds. |
| `SSRF_ALLOW_ORIGINS` | The origins on a private address that the service can get images from. The tests use this variable for the fixture origin. |
| `FETCH_TIMEOUT_MS` | The maximum time that the service waits for the origin, in milliseconds. |
| `MAX_SOURCE_BYTES` | The maximum size of a source image, in bytes. |
| `MAX_DIMENSION` | The maximum value of `width` or `height`, in pixels. |

The service must send these status codes:

| Condition | Status code |
|---|---|
| The URL, a parameter or a dimension is not valid. | 400 |
| The service does not permit the origin. | 400 |
| The origin sends the status code 404. | 404 |
| The source image is larger than the size limit. | 413 |
| The source is not an image. | 415 |
| The number of requests is more than the rate limit. | 429 |
| The origin does not respond in the permitted time. | 504 |

## Expected failures

Some tests are for behaviour that the service does not have at this time.
Each of these tests has a `todo` option.
The `todo` option gives the phase that will correct the failure.

These tests run and show their results.
But they do not cause the command to fail.

When the correction is complete, remove the `todo` option from the test.

## Baselines

The `baseline/` directory contains the results of earlier runs.
Compare new results with these results.

To record a baseline, use these commands:

```
$ node --test --test-reporter=tap acceptance/tests/*.test.js \
    | grep -E "^(not )?ok |^# (tests|pass|fail|todo) " > acceptance/baseline/<name>-tests.txt
$ npm run --silent bench > acceptance/baseline/<name>-bench.txt
```

The benchmark uses the images in the `acceptance/bench-images/` directory.
The `LICENSES.md` file in that directory gives the source and the licence of each image.
If the directory contains no images, the benchmark makes a test image.
