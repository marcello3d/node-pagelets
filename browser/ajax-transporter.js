module.exports = function(ajaxEndpoint) {
    ajaxEndpoint = ajaxEndpoint || '/!pagejax'

    function ajax(query, callback, doneCallback) {
        var req = new XMLHttpRequest
        var index = 0
        req.onreadystatechange = function() {
            if (req.readyState >= 2 && req.status !== 200) {
                callback({status: req.status, error: req.statusText})
            }

            function parseJson(packet) {
                console.log("AJAX response to " + query + ": " + packet)
                try {
                    callback(null, JSON.parse(packet))
                } catch (e) {
                    callback(e)
                }
            }

            if (req.readyState >= 3 && req.status === 200) {
                var i
                while ((i = req.responseText.indexOf('\n',index)) >= 0) {
                    parseJson(req.responseText.substring(index, i))
                    index = i+1
                }
            }
            if (req.readyState === 4) {
                if (index < req.responseText.length) {
                    parseJson(req.responseText.substring(index))
                }
                if (doneCallback) {
                    doneCallback()
                }
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
        getData: function(url, callback, closeCallback) {
            var req = ajax({getData:url}, function(error, json) {
                if (error) {
                    callback(error)
                } else if (json) {
                    if (json.error) {
                        callback(json.error)
                    } else {
                        callback(null, json)
                    }
                }
            }, closeCallback)
            return function disconnect() {
                req.abort()
            }
        }
    }
}