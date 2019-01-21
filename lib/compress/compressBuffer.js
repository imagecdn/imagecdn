const pngquant = require('./pngquant')
const mozjpeg = require('./mozjpeg')
const cwebp = require('./cwebp')

module.exports = (parameters = {}) => buffer => {
    return [cwebp, pngquant, mozjpeg].reduce((buffer, converter) => {
        return converter(parameters)(buffer)
    }, buffer)
}
