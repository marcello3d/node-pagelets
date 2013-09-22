module.exports = function() {
    var routes = []
    var map = {}
    return {
        map:map,
        add: function (newRoutes) {
            routes = routes.concat(newRoutes)
            newRoutes.forEach(function(route) {
                map[route.path] = route
            })
        },
        route: function(url) {
            for (var i=0; i<routes.length;i++) {
                var route = routes[i]
                if (route.reg ? route.reg.test(url) : route.path === url) {
                    return route
                }
            }
            return false
        }
    }
}