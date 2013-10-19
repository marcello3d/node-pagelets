var urlParse = require('url').parse
var qs = require('qs')

module.exports = function(pagelets, options) {
    options = options || {}
    var ajaxEndpoint = options.ajaxEndpoint || '/!pagejax'

    return function(req, res, next) {
        if (req.url.indexOf(ajaxEndpoint) !== 0) {
            return next()
        }
        var parsedUrl = urlParse(req.url)
        var url = parsedUrl.pathname.substr(ajaxEndpoint.length)
        var query = qs.parse(parsedUrl.query)
        switch (query.action) {
            case 'routes':
                var browserSpecs = pagelets.getRoute(url).pagelet.browserSpecs
                res.header('Content-Type', 'application/json')
                res.end(JSON.stringify(browserSpecs))
                break

            case 'get':
                res.setHeader('Content-Type', 'application/json')
                var transport = {
                    send:function(type, data) {
                        console.log(query.url+": Sending "+type)
                        res.write(JSON.stringify([type, data])+'\n')
                    },
                    setHeader:function(name,value) {
                        res.setHeader(name,value)
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
                    tag:query.tag || null,
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
    }
}