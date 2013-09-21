module.exports = function(router) {
    var cache = {}
    return {
        get: function(url, constructor) {
            var route = router.route(url)
            if (!route) {
                return false
            }
            if (!route.cache) {
                return constructor(route)
            }
            if (!cache[url]) {
                cache[url] = {
                    time:Date.now(),
                    data:constructor(route)
                }
            }
            if (route.cacheTimeout) {
                clearTimeout(cache[url].timeout)
                cache[url].timeout = setTimeout(function () {
                    delete cache[url]
                }, route.cacheTimeout)
            }
            return cache[url].data
        }
    }
}