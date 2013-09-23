var http = require('http')
var express = require('express')
var enchilada = require('enchilada')

var Pagelets = require('pagelets')
var RactiveTemplater = require('pagelets/server/ractive-templater')
var AjaxTransport = require('pagelets/server/ajax-transporter')
var JsModel = require('pagelets/server/jsmodel')

// Pagelets manager
var pagelets = new Pagelets({
    templater: new RactiveTemplater({
        viewsPath: __dirname+'/templates'
    }),
    browserJsPath:'/app.js'
})

// Define pagelets
pagelets.define('/', {
    template:'index.ract'
})
pagelets.define('/page2', {
    template:'page2.ract',
    model: function(req, callback) {
        callback(null, new JsModel({
            message:"Random: "+Math.floor(Math.random()*100)
        }))
    }
})
pagelets.define('#/header', {
    template:'_header.ract'
})
pagelets.define('#/footer', {
    template:'_footer.ract',
    model: new JsModel({ date:new Date })
})

pagelets.compile()

var app = express()

// Transport layer for use by pagelets
var transporter = new AjaxTransport(pagelets)

app.use(pagelets.middleware) // Handle top-level page requests
app.use(transporter.middleware) // Handle pagelet ajax requests

app.use(enchilada({ src: __dirname+'/static/' })) // Serve up browserified JavaScript
app.use(express.static(__dirname+'/static/')) // Serve up static files

var server = http.createServer(app)

server.listen(10101, function() {
    console.log('Server listening',server.address())
})


