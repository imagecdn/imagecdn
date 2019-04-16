module.exports = function acceptReader(req, res, next) {
    req.alternativeFormats = new Map()
    
    // Cloudflare do not support Vary on headers other than Accept-Encoding.
    // Therefore we disable this behaviour when we detect that we're on Cloudflare.
    if (req.headers['CF-RAY']) {
        res.setHeader('ICDN-Accept', 'skipped')
        return next()
    }

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
