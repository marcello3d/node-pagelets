//
//this.streaker.get(path, function(req, callback) {
//    var url = req.args.path
//    console.log("getting route for "+url,req)
//    var route = self.router.route(url)
//    if (!route) {
//        console.error("could not find route: "+url)
//        callback(404)
//    } else {
//        callback(null,self.getRouteSpec(route))
//    }
//})
//this.streaker.subscribe(path, function(req, accept) {
//    console.log("Subscription to "+req.path,req.args,req.params)
//
//    var model = new Model
//    req.unsubscribe(function() {
//        log.debug("Unsubscribed from "+req.path+": "+req.socket)
//        model.on('set', function() {
//            console.error("unsubscribed! stop setting values")
//        })
//    })
//    accept()
//    model.on('set', function(modelPath, newValue) {
//        console.log(req.path+" model set",modelPath)
//        req.socket.streak(req.path, { set:modelPath, newValue:newValue })
//    })
//    options.data && options.data(req, model)
//})