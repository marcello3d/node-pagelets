var Listenable = require('../Listenable')

module.exports = SimpleModel

function SimpleModel() {
    Listenable.call(this)
    this.data = {}
}
SimpleModel.type = 'simple'
SimpleModel.prototype = new Listenable
SimpleModel.prototype.applyDelta = function(data, tag) {
    this.data = data
    this.emit('data', data, tag)
}