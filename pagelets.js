module.exports = PageletManager

var toSource = require('tosource')
var fs = require('fs')
var Ractive = require('ractive')

function PageletManager(options) {
    if (!options) { throw new Error("options required") }

    this.options = options
    this.templater = options.templater || require('./server/ractive-templater')
    this.router = new (options.router || require('router-core'))
    this.connectionFilters = []
    this.routes = []
    this.routeMap = {}
    this.middleware = this.serve.bind(this)
    this.browserJsPath = options.browserJsPath
    this.debug = options.debug
}

PageletManager.prototype.getRoute = function(url) {
    var route = this.router.route(url)
    if (!route) { return false }
    this.compile()
    route.pagelet = route.value
    return route
}
PageletManager.prototype.serve = function(req, res, next) {
    var route = this.getRoute(req.url)
    if (!route) {
        next()
        return false
    }
    res.setHeader("Content-Type", "text/html;charset=utf-8")
    res.write(
        '<!DOCTYPE html><meta charset=utf-8>'+
        '<body><script src="'+this.options.browserJsPath+'"></script>\n'
    )

    res.write('<script>PPinit('+this.compiled+')</script>\n')
    res.end()

    // TODO: can we stream changes down to the client here?
    // Improves initial page load performance, but hurts the ability to cache the html page for future page loads
    // Only need to stream down the initial version, the client is responsible for requesting a live updating version

    // TODO: Where does CSS and custom JS/lifecycle JS fit in?

    // TODO: Maybe models have version/date information
    // When a model is requested for live updating, we include the current version with the request
    // only delta changes get sent down from that point on

    // TODO: Can we load recursively execute pagelets and stream down all the data?
    // This requires more server-side template work to actually evaluate the hrefs

    return true
}
PageletManager.prototype.serveConnection = function(options, callback) {
    var index = 0
    var filters = this.connectionFilters
    function tryNext() {
        if (index < filters.length) {
//            var filter = filters[index++]
//            filter(request, response, )
            tryNext()
        } else {
            callback()
        }
    }
    tryNext()
}
PageletManager.prototype.servePageletData = function(options) {
    var url = options.url
    var transport = options.transport
    var route = this.getRoute(url)
    if (!route) {
        return false
    }
    var pageletSpec = route.pagelet
    var request = {
        url:url,
        params:route.params,
        headers:options.headers,
        connection:options.connection
    }
    function sendError(error) {
        transport.send('error', error)
        transport.close()
    }
    var sentModel
    var response = {
        error: sendError,
        redirect: function(url) {
            transport.send('redirect', url)
            transport.close()
        },
        model: function(model) {
            if (sentModel) {
                throw new Error("Can only send model once")
            }
            sentModel = true
            var stream = model.readStream(options.tag)
            transport.onClose = function() {
                stream.close()
            }
            transport.send('model', { type:model.type })
            // ModelStream events
            stream.on('data', function(data, tag) {
                transport.send('data', { tag:tag, data:data })
            })
            stream.once('error', sendError)
            stream.once('close', function() {
                transport.close()
            })
        }
    }
    pageletSpec.get(request, response)
    return true
}
PageletManager.prototype.connectionFilter = function(connectionFilter) {
    this.connectionFilters.push(connectionFilter)
}
PageletManager.prototype.define = function(path, options) {
    this.compiled = false
    var pageletSpec = {
        path: path,
        options: options,
        browser: { path:path }
    }
    if (options.get) {
        pageletSpec.get = options.get
        pageletSpec.browser.get = true
    }
    var title = options.title || this.options.title
    if (title) { pageletSpec.browser.title = title }

    this.routes.push(pageletSpec)
    this.routeMap[path] = pageletSpec

    var routeInfo = this.router.add(path, pageletSpec)
    if (routeInfo.regexp) {
        pageletSpec.browser.reg = routeInfo.regexp
    }

}
PageletManager.prototype.compile = function() {
    if (this.compiled) { return }

    var self = this

    // Compile each pagelet
    this.routes.forEach(function(route) {
        // TODO: support multiple templaters?
        var hrefs = self.templater.compile(route)
        var pathMap = {}

        // Dereference referenced pagelets
        if (hrefs) {
            hrefs.forEach(function(href) {
                // TODO: these hrefs could have template-language specific parts
                // e.g. "/foo/{{bar}}/bah"
                var routedHref = self.router.route(href)
                if (!routedHref) {
                    throw new Error("Unknown referenced route '"+href+"' from "+route.path+" template")
                }
                pathMap[routedHref.route.path] = true
            })
        }
        route.routes = Object.keys(pathMap).map(function(path) {
            return self.routeMap[path]
        })
    })

    // Find all pagelets referenced from a given pagelet
    this.routes.forEach(function(pageletSpec) {
        var map = {}
        var browserSpecs = []
        // Recursively walk pagelet tree
        function walkChildPagelets(pagelet) {
            if (!map[pagelet.path]) {
                map[pagelet.path] = pagelet
                browserSpecs.push(pagelet.browser)
                pagelet.routes.forEach(walkChildPagelets)
            }
        }
        walkChildPagelets(pageletSpec)
        pageletSpec.browserSpecs = browserSpecs
    })
    var allRouteBrowserSpecs = this.routes.map(function (route) {
        return route.browser
    })
    this.compiled = toSource(allRouteBrowserSpecs, null, this.debug ? '  ' : 0)
}
