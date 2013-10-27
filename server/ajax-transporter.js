var urlParse = require('url').parse
var qs = require('qs')
var Listenable = require('listenable')

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
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(browserSpecs))
                break

            case 'get':
                console.log(url+": Opened connection...")
                res.setHeader('Content-Type', 'application/x-json-stream')
                var closed
                var transport = new Listenable
                transport.send = function(type, data) {
                    if (!closed) {
                        var json = JSON.stringify([type, data])
                        var flushed = res.write(json+'\n')
                        console.log(url+": "+(flushed ? 'Sent':'Queued')+" "+json.slice(0,100))
                        res.flush()
                    } else {
                        console.log(url+": Not sending "+type+" (connection closed)", data)
                    }
                }
                transport.setHeader = function(name,value) {
                    res.setHeader(name,value)
                }
                transport.close = function() {
                    if (!closed) {
                        closed = true
                        console.log(url+": Connection closed")
                        transport.send('end')
                        res.end()
                        transport.emit('close')
                    }
                }
                // Stop listening to model when connection is closed
                req.on('close', function () {
                    if (!closed) {
                        closed = true
                        console.log(url+": Connection lost")
                        transport.emit('close')
                    }
                })
                if (false === pagelets.servePageletData({
                    url:url,
                    tag:query.tag || null,
                    headers:req.headers,
                    setHeader: function(name, value) {
                        console.log(url+": Setting header: ",name, value)
                        res.setHeader(name, value)
                    },
                    transport:transport
                })) {
                    res.statusCode = 404
                    res.end()
                }
                break

            default:
                next()
        }
    }
}