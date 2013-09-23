module.exports = function(ajaxEndpoint) {
    ajaxEndpoint = ajaxEndpoint || '/!pagejax'

    function ajax(query, callback) {
        var req = new XMLHttpRequest
        var index = 0
        req.onreadystatechange = function() {
            if (req.readyState >= 2 && req.status !== 200) {
                callback({status: req.status, error: req.statusText})
            }
            var packet
            if (req.readyState >= 3 && req.status === 200) {
                var i
                while ((i = req.responseText.indexOf('\n',index)) >= 0) {
                    packet = req.responseText.substring(index, i)
                    console.log("AJAX response to "+query+": "+packet)
                    callback(null, JSON.parse(packet))
                    index = i+1
                }
            }
            if (req.readyState === 4) {
                if (index < req.responseText.length) {
                    packet = req.responseText.substring(index)
                    console.log("AJAX response to "+query+": "+packet)
                    callback(null, JSON.parse(packet))
                }
                callback()
            }
        }
        query = JSON.stringify(query)
        console.log("AJAX request to "+ajaxEndpoint+": "+query)
        req.open("post", ajaxEndpoint, true)
        req.setRequestHeader('Content-Type','application/json')
        req.send(query)
        return req
    }
    return {
        getRoutes: function(url, routesCallback) {
            ajax({getRoutes:url}, routesCallback)
        },
        getData: function(url, model) {
            var req = ajax({getData:url}, function(error, delta) {
                if (error) {
                    console && console.error("Error getting data for "+url, error)
                } else if (delta) {
                    model.applyDelta(delta)
                }
            })
            return function disconnect() {
                req.abort()
            }
        }
    }
}