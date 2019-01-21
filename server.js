const http = require('http')
const url = require('url')
const querystring = require('querystring')
const connect = require('connect')
const fetch = require('node-fetch')
const Parameters = require('./lib/parameters')
const mime = require('mime-types')
const fileType = require('file-type')

const acceptReader = require('./lib/connect/acceptReader')
const urlReader = require('./lib/connect/urlReader')
const transformBuffer = require('./lib/transform/transformBuffer')
const compressBuffer = require('./lib/compress/compressBuffer')

const app = connect()
const port = process.env.PORT || 3000

app.use(acceptReader)
app.use(urlReader)

app.use('/v1/images/', function(req, res) {
    const reqUrl = url.parse(req.url)

    const parameters = new Parameters(Object.assign({
        uri: decodeURIComponent(reqUrl.pathname.replace(/^\//, ''))
    }, req.query))

    return fetch(parameters.uri)
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
            console.log(image)
            res.setHeader('Content-Length', image.byteLength)
            res.setHeader('Content-Type', mime.contentType(parameters.format))
            return res.end(image)
        })
})

http.createServer(app).listen(port)
