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
                            // Listen for changes
                            model.on('delta', onDelta)
                            // Stop listening to model when connection is cloesd
                            req.socket.on('close', function() {
                                model.off('delta', onDelta)
                            })
                            function onDelta(delta) {
                                console.log("Writing delta for "+req.body.getData)
                                res.write(JSON.stringify(delta)+'\n')
                            }
                            // Write out initial value
                            res.write(JSON.stringify({set:'', value:model.get()})+'\n')
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