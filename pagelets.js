module.exports = PageletManager

var toSource = require('tosource')
var fs = require('fs')

var crypto = require('crypto')

var uglifyjs = require('uglify-js')
var browserify = require('browserify')
var resumer = require('resumer')
var Waiter = require('waiter')
var cleanCss = require('clean-css')

var Hasher = require('./server/hasher')

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
    this.jsHash = new Hasher(options.jsHash || '/!pagelets-#.js')
    this.cssHash = new Hasher(options.cssHash || '/!pagelets-#.css')
}

PageletManager.prototype.getRoute = function(url) {
    var route = this.router.route(url)
    if (!route) {
        return false
    }
    route.pagelet = route.value
    return route
}
PageletManager.prototype.serve = function(req, res, next) {
    if (this.cssHash.matches(req.url)) {
        return this.serveCss(req, res, next)
    }
    if (this.jsHash.matches(req.url)) {
        return this.serveJs(req, res, next)
    }
    var self = this
    var route = this.getRoute(req.url)
    if (!route) {
        return next()
    }
    this.compile(function(error) {
        if (error) {
            return next(error)
        }
        serve(req,res,self.html)
    })

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

function serve(req,res,obj) {
    res.setHeader('Content-Type',obj.contentType)
    res.setHeader('ETag', obj.tag)
    res.setHeader('Vary', 'Accept-Encoding')
    res.end(obj.src)
}
PageletManager.prototype.serveJs = function(req, res, next) {
    var self = this
    this.compile(function(error) {
        if (error) {
            return next(error)
        }
        serve(req,res,self.js)
    })
}
PageletManager.prototype.serveCss = function(req, res, next) {
    var self = this
    this.compile(function(error) {
        if (error) {
            return next(error)
        }
        serve(req,res,self.css)
    })
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
        setHeader: function(header, value) {
            transport.setHeader(header, value)
        },
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
            transport.on('close', function() {
                stream.close()
            })
            transport.send('model', { type:model.type })
            // ModelStream events
            stream.on('data', function(data, tag) {
                if (tag || data) {
                    var packet = {}
                    if (tag) {
                        packet.tag = tag
                    }
                    if (data) {
                        packet.data = data
                    }
                    transport.send('data', packet)
                }
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
PageletManager.prototype.compile = function(callback) {
    if (this.compiled) {
        return callback()
    }

    var self = this

    // Compile each pagelet
    this.routes.forEach(function(route) {
        // TODO: support multiple templaters?
        if (route.options.template) {
            var hrefs = route.options.template(route)
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
        } else {
            route.routes = []
        }
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
    var compress = !this.debug

    function make(src, contentType, urlHasher) {
        var hash = crypto.createHash('md5').update(src).digest('hex').slice(0,8)
        if (urlHasher) {
            urlHasher.setHash(hash)
        }
        return {
            tag: hash,
            contentType:contentType,
            src:src
        }
    }
    new Waiter(
        function(done) {
            var src = ''
            self.routes.forEach(function(route) {
                var routeCss = route.options.css
                if (routeCss) {
                    src += '/* '+route.path+' */\n\n'
                    if (typeof routeCss === 'function') {
                        src += routeCss()
                    } else if (typeof routeCss === 'string') {
                        src += routeCss
                    }
                    src += '\n\n'
                }
            })

            if (compress) {
                src = cleanCss.process(src, {
                    removeEmpty:true
                })
            }
            self.css = make(src, 'text/css', self.cssHash)
            done()
        },
        function(done) {
            var allRouteBrowserSpecs = self.routes.map(function (route) {
                return route.browser
            })
            var src =
                'var pagelets = require("pagelets/browser")({'+
                    'router:require("pagelets/browser/router"),'+
                    'transporter:require("pagelets/browser/ajax-transporter")(),'+
                    'templater:require("pagelets/browser/ractive-templater"),'+
                    'cache:require("pagelets/browser/cache"),'+
                    'models:['+
                    '{model:require("pagelets/model/simple/browser"),bind:require("pagelets/model/simple/ractive-bind")},'+
                    '{model:require("pagelets/model/static/browser"),bind:require("pagelets/model/static/ractive-bind")}'+
                    ']'+
                '});'+
                'pagelets('+ toSource(allRouteBrowserSpecs, null, compress ? 0 : '  ') + ')'


            var bundle = browserify(resumer().queue(src).end())
            var otherError // typically SyntaxError
            bundle.once('error', function(err) { otherError = err })
            bundle.bundle({}, function(err, src) {
                if (err || otherError) {
                    return done(err || otherError)
                }
                if (compress) {
                    src = uglifyjs.minify(src, { fromString: true }).code
                }
                self.js = make(src, 'application/javascript', self.jsHash)
                done(null)
            })
        }
    ).waitForAll(function(error) {
        if (error) {
            return callback(error)
        }
        var html = '<!DOCTYPE html>'+
            '<head><link type=text/css rel=stylesheet href="'+self.cssHash.current+'"/>' +
            '<body><script src="'+self.jsHash.current+'"></script>\n'
        self.html = make(html, 'text/html;charset=utf-8')
        self.compiled = true
        callback()
    })
}
