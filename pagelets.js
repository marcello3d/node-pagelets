module.exports = PageletManager

var toSource = require('tosource')
var fs = require('fs')
var Ractive = require('ractive')

function PageletManager(options) {
    if (!options) { throw new Error("options required") }

    this.options = options
    if (!options.transporter) {
        throw new Error("options.transporter required")
    }
    this.transporter = options.transporter
    this.templater = options.templater || require('./server/ractive-templater')
    this.router = new (options.router || require('router-core'))
    this.pagelets = []
    this.pageletMap = {}
    this.middleware = this.serve.bind(this)
}



PageletManager.prototype.serve = function(req, res, next) {
    var route = this.router.route(req.url)
    if (!route) {
        next()
        return false
    }
    this.compile()
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    var routeSpec = route.value
    var routeOptions = routeSpec.options
    res.write(
        '<!DOCTYPE html>'+
        '<meta charset=utf-8>'+
        '<title>'+(routeOptions.title||this.options.title)+'</title>'+
        '<link rel="stylesheet" href="'+(routeOptions.css||options.css)+'" />'+
        '<body><script src="/js/pagelet.js"></script>\n'
    )
    var pageletSpecs = route.value.allPagelets.map(function(pagelet) {
        return pagelet.spec
    })
    res.write('<script>PPinit('+toSource(pageletSpecs,null,0)+')</script>\n')
    res.end()

    return true
//        var model = new Model
//        model.on('set', function() {
//            res.write('<script>Rdata('+toSource(model.get(),null,0)+')</script>')
//            res.end()
//            model.off(arguments.callee)
//        })
//        routeOptions.data && routeOptions.data({
//            req:req,
//            params:route.params
//        }, model)

    // TODO: can we stream changes down to the client here?
    // Improves initial page load performance, but hurts the ability to cache the html page for future page loads
    // Only need to stream down the initial version, the client is responsible for requesting a live updating version

    // TODO: Where does CSS and custom JS/lifecycle JS fit in?

    // TODO: Maybe models have version/date information
    // When a model is requested for live updating, we include the current version with the request
    // only delta changes get sent down from that point on

    // TODO: Can we load recursively execute pagelets and stream down all the data?
    // This requires more server-side template work to actually evaluate the hrefs
}

PageletManager.prototype.define = function(path, options) {
    var self = this
    this.compiled = false
    var pagelet = {
        options:options,
        spec: { path:path }
    }
    if (options.title) { pagelet.spec.title = options.title }


    this.pagelets.push(pagelet)
    this.pageletMap[path] = pagelet

    this.router.add(path, pagelet)

    // TODO: fit these in better
    this.cache.add(path, pagelet)
    this.transporter.add(path, pagelet)

}
PageletManager.prototype.compile = function() {
    if (this.compiled) { return }

    var self = this
    this.pagelets.forEach(function(pagelet) {
        // TODO: support multiple templaters?
        var hrefs = self.templater.compile(pagelet)
        var pathMap = {}

        // Dereference referenced pagelets
        if (hrefs) {
            hrefs.forEach(function(href) {
                // TODO: these hrefs could have template-language specific parts
                // e.g. "/foo/{{bar}}/bah"
                var routedHref = self.router.route(href)
                if (!routedHref) {
                    throw new Error("Unknown referenced pagelet '"+href+"' from "+pagelet.path+" template")
                }
                var path = routedHref.route.path
                pathMap[path] = true
            })
        }
        pagelet.pagelets = Object.keys(pathMap).map(function(path) {
            return self.pageletMap[path]
        })
    })

    // Find all pagelets referenced from a given pagelet
    this.pagelets.forEach(function(pagelet) {
        var map = {}
        var allPagelets = []
        // Recursively walk pagelet tree
        function walkChildPagelets(pagelet) {
            if (!map[pagelet.path]) {
                map[pagelet.path] = pagelet
                allPagelets.push(pagelet)
                pagelet.pagelets.forEach(walkChildPagelets)
            }
        }
        walkChildPagelets(pagelet)
        pagelet.allPagelets = allPagelets
    })
    this.compiled = true
}
