const http = require('http')
const url = require('url')
const os = require('os')
const connect = require('connect')
const httpProxy = require('http-proxy')
const throng = require('throng')
const fetch = require('make-fetch-happen').defaults({
    cacheManager: os.tmpdir()
})

const Parameters = require('./lib/parameters')
const mime = require('mime-types')
const fileType = require('file-type')

const acceptReader = require('./lib/connect/acceptReader')
const urlReader = require('./lib/connect/urlReader')
const transformBuffer = require('./lib/transform/transformBuffer')
const compressBuffer = require('./lib/compress/compressBuffer')

const app = connect()
const port = process.env.PORT || 3000
const workers = process.env.WEB_CONCURRENCY || 1

app.use(acceptReader)
app.use(urlReader)

app.use('/v2/health', function(req, res) {
    res.setHeader('Cache-Control', [
        'private',
        'max-age=0',
        'no-cache',
        'no-store',
        'must-revalidate'
    ].join(', '))
    res.setHeader('Expires', new Date(Date.now() - 1000).toUTCString())
    return res.end(JSON.stringify({
        status: 'OK',
        latestCheck: Date.now()
    }))
})
app.use('/v2/image/', function(req, res) {
    const reqUrl = url.parse(req.url)

    const parameters = new Parameters(Object.assign({
        uri: decodeURIComponent(reqUrl.pathname.replace(/^\//, ''))
    }, req.query))

    return fetch(parameters.uri, {
        cache: 'force-cache'
    })
        .catch(err => {
            console.log(err)
            res.statusCode = 404
            return res.end(JSON.stringify({
                error: "Image not found."
            }))
        })

        .then(res => res.buffer())
        .then(buffer => {
            if (!parameters.format) {
                const {ext} = fileType(buffer)

                // We treat WebP and JPG as one and the same.
                // This allows older browsers to be served the right image format.
                if (ext === 'jpg' || ext === 'webp') {
                    parameters.format = 'jpg'
                    if (req.alternativeFormats.has('jpg')) {
                        parameters.format = req.alternativeFormats.get('jpg')
                    }

                //
                } else if (ext === 'png') {
                    parameters.format = 'png'
                }
            }
            return buffer
        })
        .then(buffer => transformBuffer(parameters)(buffer))
        .then(buffer => compressBuffer(parameters)(buffer))
        .then(image => {
            res.setHeader('Content-Length', image.byteLength)
            res.setHeader('Content-Type', mime.contentType(parameters.format))

            // Instruct upstream proxies to cache this for a month.
            const cacheTtl = 60 * 60 * 24 * 30
            res.setHeader('Cache-Control', `public, max-age=${cacheTtl} s-maxage=${cacheTtl}`)
            res.setHeader('Expires', new Date(Date.now() + cacheTtl*1000).toUTCString())

            // Allow CORS from everywhere for more advanced image use-cases.
            res.setHeader('Access-Control-Allow-Origin', '*')

            return res.end(image)
        })

        // Generic error handling.
        .catch(err => {
            console.error(err)
            res.statusCode = 503
            return res.end(JSON.stringify({
                error: "An unexpected error occurred, if the issue persists please get in touch with imagecdn.support@imagecdn.app"
            }))
        })
})
// Handle redirects from /v1/ service to /v2/
app.use('/v1/images/', (req, res) => {
    res.setHeader('Location', req.originalUrl
        // Endpoint is now singular.
        .replace('/v1/images/', '/v2/image/')
        // Fill is now Fit to reflect common terminology.
        .replace('fill=', 'fit=')
    )
    res.statusCode = 301
    return res.end()
})

// Fall-back to docsite for unknown routes.
const proxyToOrigin = (req, res) => {
    req.url = req.originalUrl
    return httpProxy.createProxyServer({
        target: 'http://imagecdn.github.io',
        headers: {
            'Host': 'imagecdn.app'
        }
    }).web(req, res);
}
app.use('/getting-started', proxyToOrigin)
app.use('/docs', proxyToOrigin)
app.use('/about', proxyToOrigin)
app.use('/', proxyToOrigin)
app.use('/*', proxyToOrigin)

async function main() {
    const server = http.createServer(app).listen(port, _ => {
        console.log(`Now listening on ${server.address().port}`)
    })
}
throng({
    workers,
    lifetime: Infinity
}, main)
