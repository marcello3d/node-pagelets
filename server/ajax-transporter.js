var bodyParser = require('connect').bodyParser
module.exports = function(pagelets, options) {
    options = options || {}
    var ajaxEndpoint = options.ajaxEndpoint || '/!pagejax'

    var parser = bodyParser()

    this.middleware = function(req, res, next) {
        if (req.url === ajaxEndpoint) {
            console.log(req.headers['content-type'])
            parser(req, res, function() {
                if (req.body.getRoutes) {
                    res.header('Content-Type','application/json')
                    res.end(JSON.stringify(pagelets.getPageletSpec(req.body.getRoutes).browserSpecs))
                } else if (req.body.getData) {
                    res.header('Content-Type','application/json')
                    res.end(JSON.stringify({}))
                } else {
                    next()
                }
            })
        } else {
            next()
        }
    }
}