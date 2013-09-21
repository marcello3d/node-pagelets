module.exports = ClientRouter

var toSource = require('tosource')
var fs = require('fs')
var Ractive = require('ractive')

var Router = require('router-core')

function ClientRouter(options) {
    var self = this
    this.streaker = options.streaker
    this.options = options
    var router = this.router = new Router
    this.middleware = function(req, res, next) {
        var route = router.route(req.url)
        if (route) {
            return renderPage(route, req, res, next)
        }
        next()
    }

    function renderPage(route, req, res) {
        self.compile()
        res.setHeader("Content-Type", "text/html; charset=utf-8")
        var routeSpec = route.value
        var routeOptions = routeSpec.options
        res.write(
            '<!DOCTYPE html>'+
                '<meta charset=utf-8>'+
                '<title>'+(routeOptions.title||options.title)+'</title>'+
                '<link rel="stylesheet" href="'+(routeOptions.css||options.css)+'" />'+
                '<body><script src="/js/page.js"></script>\n'
        )
        var routes = self.getRouteSpec(route)
        res.write('<script>Rinit('+toSource(routes,null,0)+')</script>\n')
        res.end()
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
        // Only need to stream down the initial version, the client is responsible for requesting a live updating version

        // How does initialization code for the page work?

        // Each model should have a version identifier with it
        // When a model is requested for live updating, we include the current version with the request
        // only delta changes get sent down from that point on

        // Can we combine multiple partial routes into one page? Update each of the individually?
    }
}

function parseTemplate(client, path) {
    try {
        require(client.options.viewSrc + '/' + path)
    } catch (e) {
        // ignore
    }
    return Ractive.parse(fs.readFileSync(client.options.viewSrc + '/' + path, 'utf8'))
}
ClientRouter.prototype.getRouteSpec = function(route) {
    return route.value.allPagelets.map(function(route) {
        var o = {
            path:route.path,
            title:route.value.options.title,
            ract:route.value.template
        }
        if (route.regexp) { o.reg = route.regexp }
        if (route.value.pagelets) { o.pp = route.value.pagelets }
        return o
    })
}
ClientRouter.prototype.get = function(path, options) {
    var self = this
    this.compiled = false
    this.router.add(path, {
        options:options,
        template:parseTemplate(this, options.template)
    })
    this.streaker.get(path, function(req, callback) {
        var url = req.args.path
        console.log("getting route for "+url,req)
        var route = self.router.route(url)
        if (!route) {
            console.error("could not find route: "+url)
            callback(404)
        } else {
            callback(null,self.getRouteSpec(route))
        }
    })
    this.streaker.subscribe(path, function(req, accept) {
        console.log("Subscription to "+req.path,req.args,req.params)

        var model = new Model
        req.unsubscribe(function() {
            log.debug("Unsubscribed from "+req.path+": "+req.socket)
            model.on('set', function() {
                console.error("unsubscribed! stop setting values")
            })
        })
        accept()
        model.on('set', function(modelPath, newValue) {
            console.log(req.path+" model set",modelPath)
            req.socket.streak(req.path, { set:modelPath, newValue:newValue })
        })
        options.data && options.data(req, model)
    })

}
ClientRouter.prototype.compile = function() {
    if (this.compiled) { return }

    var self = this
    var routeMap = {}
    this.router.routes.forEach(function(route) {
        routeMap[route.path] = route
        var template = route.value.template
        var pagelets = {}
        var pp = 0
        template.forEach && template.forEach(walkRactiveAST)
        function walkRactiveAST(node) {
            var href, path
            if (node.t) {
                if (node.t === 15 && node.e === 'pagelet') {
                    href = self.router.route(node.a.href)
                    if (!href) {
                        throw new Error("Unknown path '"+node.a.href+"' in <rv-pagelet> tag from '"+route.value.options.template+"'")
                    }
                    path = href.route.path
                    if (!pagelets[path]) {
                        pagelets[path] = '-pp'+pp++
                    }
                    node.e = pagelets[path]
                }
                node.f && node.f.forEach && node.f.forEach(walkRactiveAST)
            }
        }
        var pageletRoutes = Object.keys(pagelets)
        if (pageletRoutes.length) {
            var invertedPagelets = {}
            pageletRoutes.forEach(function(key) {
                invertedPagelets[pagelets[key]] = key
            })
            route.value.pagelets = invertedPagelets
            route.value.pageletRoutes = pageletRoutes
        }
    })
    this.router.routes.forEach(function(route) {
        var map = {}
        function walkPagelets(route) {
            if (!map[route.path]) {
                map[route.path] = route
                route.value.pageletRoutes && route.value.pageletRoutes.forEach(function(href) {
                    walkPagelets(routeMap[href])
                })
            }
        }
        walkPagelets(route)
        route.value.allPagelets = Object.keys(map).map(function(href) { return routeMap[href] })
    })
    this.compiled = true
}

