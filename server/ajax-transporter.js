module.exports = AjaxTransport

function AjaxTransport() {
    this.middleware = function(req, res, next) {
        next()
    }
}


AjaxTransport.prototype.add = function(pagelet) {

}