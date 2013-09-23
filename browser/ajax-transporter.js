module.exports = function(ajaxEndpoint) {
    ajaxEndpoint = ajaxEndpoint || '/!pagejax'

    function ajax(query, callback) {
        var req = new XMLHttpRequest
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    callback({status: req.status, error: req.statusText})
                } else {
                    callback(null, JSON.parse(req.responseText))
                }
            }
        }
        req.open("post", ajaxEndpoint, true)
        req.setRequestHeader('Content-Type','application/json')
        req.send(JSON.stringify(query))
        return req
    }
    return {
        getRoutes: function(url, routesCallback) {
            ajax({getRoutes:url}, routesCallback)
        },
        getData: function(url, model) {
            // TODO: ajax? engine.io?
            var req = ajax({getData:url}, function(error, data) {
                if (error) {
                    console && console.error("Error getting data for "+url, error)
                } else {
                    model.set(data)
                }

            })

            return function disconnect() {
                req.abort()
            }

        }
    }
}