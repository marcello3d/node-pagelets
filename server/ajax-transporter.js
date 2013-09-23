var bodyParser = require('connect').bodyParser
module.exports = function(pagelets, options) {
    options = options || {}
    var ajaxEndpoint = options.ajaxEndpoint || '/!pagejax'

    var parser = bodyParser()

    this.middleware = function(req, res, next) {
        if (req.url === ajaxEndpoint) {
            parser(req, res, function() {
                if (req.body.getRoutes) {
                    var browserSpecs = pagelets.getPageletSpec(req.body.getRoutes).browserSpecs
                    res.header('Content-Type','application/json')
                    res.end(JSON.stringify(browserSpecs))
                } else if (req.body.getData) {
                    var pageletSpec = pagelets.getPageletSpec(req.body.getData)
                    if (pageletSpec.model) {
                        pageletSpec.model(req, function(error, model) {
                            if (error) { return next(error) }
                            res.header('Content-Type','application/json')
                            res.end(JSON.stringify(model.get()))
                        })
                    }
                } else {
                    next()
                }
            })
        } else {
            next()
        }
    }
}