module.exports = function (options) {
    var router = options.router()
    var transporter = options.transporter
    var cache = options.cache(router)
    var models = {}
    if (options.models) {
        options.models.forEach(function(model) {
            models[model.model.type] = model
        })
    }
    var templater = options.templater(getPagelet)

    function getPagelet(url) {
        return cache.get(url, function(route) {
            // TODO: support per-route model types?
            var disconnect
            var model

            var pagelet = {
                url: url,
                route: route,
                teardown: function() {
                    if (disconnect) { disconnect() }
                }
            }
            // Initialize pagelet template/dom
            templater.init(pagelet)

            // Initialize pagelet model
            if (route.model) {
                // Get the data from the backend
                disconnect = transporter.getData(url, function(error, packet) {
                    if (error) {
                        console.error(error)
                    } else if (packet.type) {
                        // Construct new model
                        if (pagelet.model) {
                            throw new Error("Got multiple models for pagelet "+url)
                        }
                        var modelType = models[packet.type]
                        if (!modelType) {
                            throw new Error("Unknown model type '"+packet.type+"'")
                        }
                        pagelet.model = new modelType.model
                        // Bind the model to the template
                        modelType.bind(pagelet)
                    } else {
                        if (!pagelet.model) {
                            throw new Error("Got delta packet before model type")
                        }
                        pagelet.model.applyDelta(packet.data, packet.tag)
                        pagelet.model.lastTag = packet.tag
                    }
                })

            }

            // TODO: execute JS state lifecycle events: init/show/hide/teardown
            // TODO: abstract model<->ractive binding

            return pagelet
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
                    } else if (routeSpecs) {
                        router.add(routeSpecs)
                        loadPage(false, url)
                    }
                })
            }
        }
    }
}