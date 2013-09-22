var Pagelets = require('../../pagelets')
var http = require('http')

var RactiveTemplater = require('../../server/ractive-templater')
var AjaxTransport = require('../../server/ajax-transport')

var transporter = new AjaxTransport

var manager = new Pagelets({
    templater: new RactiveTemplater({
        viewsPath: __dirname+'/templates'
    }),
    transporter: transporter
})

manager.define('/', {
    template:'index.ract'
})
manager.define('#/header', {
    template:'_header.ract'
})
manager.define('#/footer', {
    template:'_footer.ract',
    model: {
        date:new Date
    }
})


var server = http.createServer()
server.on('request', manager.middleware)
// Hook up AJAX transport
transporter.listen(server)

server.listen(10101)

