var http = require('http')
var connect = require('connect')

var Pagelets = require('pagelets')
var RactiveTemplater = require('pagelets/server/ractive-templater')
var AjaxTransport = require('pagelets/server/ajax-transporter')
var SimpleModel = require('pagelets/model/simple/server')

// Pagelets manager
var pagelets = new Pagelets({
    debug:true
})


/*

 pagelets bootstrap file needs:

 1. pagelets client core module
 2. transporter module

 3. routes definitions
 a. template module (based on route definitions?)
 b. model module (based on route definitions?)
 c. route custom code
 d. route CSS (possibly external)

 */


// Define pagelets
pagelets.define('/', {
    template:RactiveTemplater(__dirname+'/templates/index.ract')
})
pagelets.define('/page2', {
    template:RactiveTemplater(__dirname+'/templates/page2.ract'),
    get: function(req, res) {
        var model = new SimpleModel
        res.model(model)
        var interval = setInterval(function() {
            model.data.message = "Random: "+Math.floor(Math.random()*100)
            model.update()
        },50)
        req.onClose(function() {
            clearInterval(interval)
        })
    }
})
pagelets.define('!/header', {
    template:RactiveTemplater(__dirname+'/templates/_header.ract')
})
var footerModel = new SimpleModel({ date:new Date })
pagelets.define('!/footer', {
    template:RactiveTemplater(__dirname+'/templates/_footer.ract'),
    get: function(req,res) {
        res.model(footerModel)
    }
})
setInterval(function() {
    footerModel.data.date = new Date
    footerModel.update()
}, 1000)

pagelets.compile(function(error) {
    if (error) {
        console.error("Error compiling pagelets:",error)
        return
    }

    var app = connect()

// Transport layer for use by pagelets
    app.use(connect.compress())
    app.use(pagelets.middleware) // Handle top-level page requests
    app.use(AjaxTransport(pagelets)) // Handle pagelet ajax requests

    var server = http.createServer(app)

    server.listen(10101, function() {
        console.log('Server listening',server.address())
    })
})