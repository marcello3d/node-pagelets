module.exports = function(network, cache, Model) {
    return {
        getRoutes: function(url, routesCallback) {
            network.getRoutes(url, routesCallback)
        },
        getPagelet: function(url) {
            return cache.get(url, function(route) {
                var model = new Model
                // TODO: version tag feature?
                var subscription = network.getData(url, model)
                return {
                    url:url,
                    route:route,
                    model:model,
                    disconnect: function() {
                        subscription.disconnect()
                    }
                }
            })
        }
    }
}

