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
            return res.end(image)
        })
})
// Handle redirects from /v1/ service to /v2/
app.use('/v1/images/', (req, res) => {
    res.setHeader('Location', req.originalUrl.replace('/v1/images/', '/v2/image/'))
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
