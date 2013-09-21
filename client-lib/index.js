window.PPinit = function(initialRoutes) {
    var router = require('./router')()
    var network = require('./network')
    var cache = require('./cache')(router)
    var JsModel = require('../lib/jsmodel')
    var transporter = require('./transporter')(network, cache, JsModel)
    var templater = require('./ractive-templater')(transporter)

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

    // TODO: inline data
//    window.PPdata = function(data) {
//        console.log("rdata", data)
//        ractive.set(data)
//        history.replaceState(data, document.title, document.location)
//    }

    loadPage(false)

    function loadPage(pushState, url) {
        url = url || document.location.pathname
        var route = router.route(url)
        if (route) {
            if (lastPath === url) {
                console.log("Already loaded "+lastPath)
            } else {
                lastPath = url
                console.log("Loading "+lastPath)
                templater.show(url)
                if (pushState) {
                    history.pushState({}, '', url)
                } else {
                    history.replaceState({}, '', url)
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