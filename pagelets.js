module.exports = PageletManager

var toSource = require('tosource')
var fs = require('fs')
var Ractive = require('ractive')

function PageletManager(options) {
    if (!options) { throw new Error("options required") }

    this.options = options
    this.templater = options.templater || require('./server/ractive-templater')
    this.router = new (options.router || require('router-core'))
    this.pageletSpecs = []
    this.pageletSpecMap = {}
    this.middleware = this.serve.bind(this)
    this.browserJsPath = options.browserJsPath
}

PageletManager.prototype.getPageletSpec = function(url) {
    var route = this.router.route(url)
    if (!route) { return false }
    this.compile()
    return route.value
}
PageletManager.prototype.serve = function(req, res, next) {
    var pageletSpec = this.getPageletSpec(req.url)
    if (!pageletSpec) {
        next()
        return false
    }
    res.setHeader("Content-Type", "text/html;charset=utf-8")
    res.write(
        '<!DOCTYPE html><meta charset=utf-8>'+
        '<body><script src="'+this.options.browserJsPath+'"></script>\n'
    )

    res.write('<script>PPinit('+toSource(pageletSpec.browserSpecs,null,0)+')</script>\n')
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

PageletManager.prototype.define = function(path, options) {
    this.compiled = false
    var pageletSpec = {
        path: path,
        options: options,
        browser: { path:path }
    }
    var title = options.title || this.options.title
    if (title) { pageletSpec.browser.title = title }


    this.pageletSpecs.push(pageletSpec)
    this.pageletSpecMap[path] = pageletSpec

    this.router.add(path, pageletSpec)

    // TODO: fit these in better
//    this.cache.add(path, pageletSpec)
//    this.transporter.add(path, pageletSpec)

}
PageletManager.prototype.compile = function() {
    if (this.compiled) { return }

    var self = this

    // Compile each pagelet
    this.pageletSpecs.forEach(function(pagelet) {
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
                pathMap[routedHref.route.path] = true
            })
        }
        pagelet.pageletSpecs = Object.keys(pathMap).map(function(path) {
            return self.pageletSpecMap[path]
        })
    })

    // Find all pagelets referenced from a given pagelet
    this.pageletSpecs.forEach(function(pageletSpec) {
        var map = {}
        var browserSpecs = []
        // Recursively walk pagelet tree
        function walkChildPagelets(pagelet) {
            if (!map[pagelet.path]) {
                map[pagelet.path] = pagelet
                browserSpecs.push(pagelet.browser)
                pagelet.pageletSpecs.forEach(walkChildPagelets)
            }
        }
        walkChildPagelets(pageletSpec)
        pageletSpec.browserSpecs = browserSpecs
    })
    this.compiled = true
}
