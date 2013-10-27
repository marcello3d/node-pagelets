var Listenable = require('listenable')

module.exports = StaticModel

function StaticModel() {
    Listenable.call(this)
    this.data = {}
}
StaticModel.type = 'static'
StaticModel.prototype = new Listenable
StaticModel.prototype.applyDelta = function(data, tag) {
    this.data = data
    this.emit('data', data, tag)
}