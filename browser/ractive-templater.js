var Ractive = require('ractive/build/Ractive.runtime')

module.exports = function(getPagelet) {
    var currentRactive
    var components = { pagelet: RactivePagelet }

    function RactivePagelet(options) {
        var pagelet = getPagelet(options.data.href)
        if (!pagelet) { throw new Error("Could not load pagelet: "+options.data.href)}
        var route = pagelet.route
        if (!route.Component) {
            route.Component = Ractive.extend({
                template: route.ract,
                data: {},
                debug:true,
                components:components
            })
        }
        var ractiveComponent = new route.Component(options)
        ractiveComponent.set(pagelet.model.get())
        pagelet.model.on('set',function(path,value) {
            if (path) {
                ractiveComponent.set(path,value)
            } else {
                ractiveComponent.set(value)
            }
        })
        pagelet.model.on('update', function(path) {
            ractiveComponent.update(path)
        })
        // TODO: reverse binding
        // TODO: execute JS state lifecycle events: init/show/hide/teardown
        // TODO: abstract model<->ractive binding
        // TODO: teardown bindings on teardown
        return ractiveComponent
    }

    return {
        show: function(url) {
            if (currentRactive) {
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