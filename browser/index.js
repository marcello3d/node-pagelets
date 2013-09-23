module.exports = function (options) {
    var router = options.router()
    var transporter = options.transporter
    var cache = options.cache(router)
    var Model = options.model
    var templater = options.templater(getPagelet)

    function getPagelet(url) {
        return cache.get(url, function(route) {
            // TODO: support per-route model types?
            var model = new Model
            var disconnect
            if (route.model) {
                // TODO: version tag management?
                disconnect = transporter.getData(url, model)
            } else {
                disconnect = function() {}
            }
            return {
                url:url,
                route:route,
                model:model,
                teardown: disconnect
            }
        })
    }

    window.PPinit = function(initialRoutes) {
        var lastPath

        router.add(initialRoutes)

        window.onpopstate = function(event) {
            loadPage(false, null, event.state)
        }
        document.addEventListener('click',function(event) {
            if (event.target.nodeName === 'A') {
                var href = event.target.href.substring((location.protocol+'//'+location.host).length)
                console.log("Loading..."+href)
                if (href.substring(0,1) === '/') {
                    loadPage(true, href)
                    event.preventDefault()
                } else {
                    console.log("didn't match "+href)
                }
            }
        }, true)

        loadPage(false)
        function loadPage(pushState, url) {
            url = url || document.location.pathname
            var route = router.route(url)
            if (route) {
                if (lastPath !== url) {
                    lastPath = url
                    console.log("Loading "+lastPath)
                    templater.show(url)
                    if (pushState) {
                        history.pushState({}, document.title, url)
                    } else {
                        history.replaceState({}, document.title, url)
                    }
                }
            } else {
                transporter.getRoutes(url, function(error, routeSpecs) {
                    if (error) {
                        console.error("no route to "+url)
                        window.location = url
                    } else {
                        router.add(routeSpecs)
                        loadPage(false, url)
                    }
                })
            }
        }
    }
}