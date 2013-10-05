var bodyParser = require('connect').bodyParser()
module.exports = function(pagelets, options) {
    options = options || {}
    var ajaxEndpoint = options.ajaxEndpoint || '/!pagejax'

    return function(req, res, next) {
        if (req.url !== ajaxEndpoint) {
            return next()
        }
        bodyParser(req, res, function () {
            var url
            if (req.body.getRoutes) {
                url = req.body.getRoutes
                var browserSpecs = pagelets.getRoute(url).pagelet.browserSpecs
                res.header('Content-Type', 'application/json')
                res.end(JSON.stringify(browserSpecs))
            } else if (req.body.getData) {
                url = req.body.getData
                var route = pagelets.getRoute(url)
                var pageletSpec = route.pagelet
                if (pageletSpec.model) {
                    var request = {
                        url:req.body.getData,
                        params:route.params
                    }
                    var sentModel
                    var response = {
                        error: function() {
                            res.end(500)
                        },
                        model: function(model) {
                            if (sentModel) { throw new Error("Already sent model!") }
                            sentModel = true
                            var stream = model.readStream(req.body.tag || undefined)
                            res.header('Content-Type', 'application/json')
                            function writeObject(object) {
                                res.write(JSON.stringify(object)+'\n')
                            }
                            writeObject({ type:model.type })
                            // ModelStream events
                            stream.on('data', function(data, tag) {
                                writeObject({ tag:tag, data:data })
                            })
                            stream.once('error', function(error) {
                                writeObject({
                                    error:error
                                })
                            })
                            stream.once('close', function() {
                                res.end()
                            })
                            // Stop listening to model when connection is closed
                            req.socket.on('close', function () {
                                stream.close()
                            })
                        }
                    }
                    pageletSpec.model(request, response)
                } else {
                    console.error()
                    res.status(404)
                    res.end()
                }
            } else {
                next()
            }
        })
    }
}