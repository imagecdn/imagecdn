const {parse} = require('url')
const querystring = require('querystring')

module.exports = function urlReader(req, res, next) {
    const {query} = parse(req.url)
    req.query = querystring.parse(query)
    return next()
}
