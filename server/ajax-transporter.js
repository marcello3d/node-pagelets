var bodyParser = require('connect').bodyParser()
module.exports = function(pagelets, options) {
    options = options || {}
    var ajaxEndpoint = options.ajaxEndpoint || '/!pagejax'

    return function(req, res, next) {
        if (req.url !== ajaxEndpoint) {
            return next()
        }
        bodyParser(req, res, function () {
            var url = req.body.url
            console.log(url+": "+req.body.action)
            switch (req.body.action) {
                case 'routes':
                    var browserSpecs = pagelets.getRoute(url).pagelet.browserSpecs
                    res.header('Content-Type', 'application/json')
                    res.end(JSON.stringify(browserSpecs))
                    break

                case 'get':
                    res.setHeader('Content-Type', 'application/json')
                    var transport = {
                        send:function(type, data) {
                            console.log(req.body.url+": Sending "+type)
                            res.write(JSON.stringify([type, data])+'\n')
                        },
                        close:function() {
                            res.end()
                        }
                    }
                    // Stop listening to model when connection is closed
                    req.socket.on('close', function () {
                        if (transport.onClose) {
                            transport.onClose()
                        }
                    })
                    if (false === pagelets.servePageletData({
                        url:url,
                        tag:req.body.tag || null,
                        headers:req.headers,
                        setHeader: function(name, value) {
                            console.log("Setting header: ",name, value)
                            res.setHeader(name, value)
                        },
                        transport:transport
                    })) {
                        res.status(404)
                        res.end()
                    }
                    break

                default:
                    next()
            }
        })
    }
}