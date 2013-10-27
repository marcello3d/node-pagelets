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
    var lastPath

    function loadPage(pushState, url) {
        url = url || document.location.pathname
        var route = router.route(url)
        if (!route) {
            return false
        }
        if (lastPath !== url) {
            lastPath = url
            console.log("Loading " + lastPath)
            templater.show(url)
            if (pushState) {
                history.pushState({}, document.title, url)
            } else {
                history.replaceState({}, document.title, url)
            }
        }
        return true
    }

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
            if (route.get) {
                // Get the data from the backend
                disconnect = transporter.getData(url, function(type, data) {
                    switch (type) {
                        case 'error':
                            console.error('Error on '+url+':',data)
                            break

                        case 'redirect':
                            console.log("Got redirect:",data)
                            if (!loadPage(false, data)) {
                                window.location = data
                            }
                            break

                        case 'model':
                            // Construct new model
                            if (pagelet.model) {
                                throw new Error("Got multiple models for pagelet "+url)
                            }
                            var modelType = models[data.type]
                            if (!modelType) {
                                throw new Error("Unknown model type '"+data.type+"'")
                            }
                            pagelet.model = new modelType.model
                            // Bind the model to the template
                            modelType.bind(pagelet)
                            break

                        case 'data':
                            if (!pagelet.model) {
                                throw new Error("Got delta packet before model type")
                            }
                            pagelet.model.applyDelta(data.data, data.tag)
                            pagelet.model.lastTag = data.tag
                            break

                        default:
                            console.error('Unrecognized packet '+type+':', data)
                            break
                    }
                })

            }

            // TODO: execute JS state lifecycle events: init/show/hide/teardown
            // TODO: abstract model<->ractive binding

            return pagelet
        })
    }

    return function(initialRoutes) {
        router.add(initialRoutes)
        window.onpopstate = function(event) { loadPage(false, null, event.state) }
        document.addEventListener('click',function(event) {
            if (event.target.nodeName === 'A') {
                var href = event.target.href.substring((location.protocol+'//'+location.host).length)
                console.log("Loading..."+href)
                if (href.charAt(0) === '/') {
                    if (loadPage(true, href)) {
                        event.preventDefault()
                    }
                }
            }
        }, true)
        loadPage(false)
    }
}