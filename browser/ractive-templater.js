var Ractive = require('ractive/build/Ractive.runtime')

module.exports = function(getPagelet) {
    var currentRactive
    var components = { pagelet: RactivePagelet }

    function RactivePagelet(options) {
        console.log("init pagelet "+options.data.href)
        var pagelet = getPagelet(options.data.href)
        if (!pagelet) {
            throw new Error("Could not load pagelet: "+options.data.href)
        }
        // Previously initialized ractive?
        if (!pagelet.ractive) {
            pagelet.ractive = new pagelet.route.Component(options)
            if (pagelet.route.ractEv) {
                pagelet.ractive.on(pagelet.route.ractEv)
            }
        }
        return pagelet.ractive
    }

    return {
        init: function(pagelet) {
            var route = pagelet.route
            if (!route.Component) {
                route.Component = Ractive.extend({
                    template: route.ract,
                    data: {},
                    debug:true,
                    components:components
                })
            }
            // TODO: reverse binding
            // TODO: execute JS state lifecycle events: init/show/hide/teardown
            // TODO: abstract model<->ractive binding
            // TODO: teardown bindings on teardown

        },
        show: function(url) {
            if (currentRactive) {
                // TODO: explicitly find all the old pagelets and tear them down
                currentRactive.teardown()
            }
            currentRactive = new RactivePagelet({
                data:{
                    href:url
                },
                el:document.body
            })
        }
    }
}