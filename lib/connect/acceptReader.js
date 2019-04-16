module.exports = function acceptReader(req, res, next) {
    req.alternativeFormats = new Map()

    // This is a _very_ broad cache-key. Reduce if possible.
    if (req.headers.accept) {
        res.setHeader('Vary', 'Accept')
        res.setHeader('ICDN-Accept', req.headers.accept)
        if (req.headers.accept.includes('image/webp')) {
            req.alternativeFormats.set('jpg', 'webp')
        }
    }

    return next()
}
