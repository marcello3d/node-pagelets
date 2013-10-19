module.exports = function(ajaxEndpoint) {
    ajaxEndpoint = ajaxEndpoint || '/!pagejax'

    function ajax(url, action, callback, doneCallback) {
        var req = new XMLHttpRequest
        var index = 0
        var endpoint = ajaxEndpoint+url+'?action='+action
        req.onreadystatechange = function() {
            if (req.readyState >= 2 && req.status !== 200) {
                callback({status: req.status, error: req.statusText})
            }

            function parseJson(packet) {
                console.log("AJAX response to " + endpoint + ": " + packet)
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
        req.open("post", endpoint, true)
        req.setRequestHeader('Content-Type','application/json')
        req.send()
        return req
    }
    return {
        getRoutes: function(url, routesCallback) {
            ajax(url, 'routes', routesCallback)
        },
        getData: function(url, packetCallback, closeCallback) {
            var req = ajax(url, 'get', function(error, json) {
                if (error) {
                    packetCallback('error', error)
                } else {
                    packetCallback(json[0], json[1])
                }
            }, closeCallback)
            return function disconnect() {
                req.abort()
            }
        }
    }
}