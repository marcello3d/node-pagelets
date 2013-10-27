var Listenable = require('listenable')

module.exports = StaticModel

function StaticModel(data) {
    this.data = data || {}
}

StaticModel.prototype.type = 'static'
StaticModel.prototype.readStream = function(tag) {
    var stream = new Listenable
    var closed
    stream.close = function() {
        closed = true
        stream.emit('close')
    }
    var self = this
    process.nextTick(function() {
        if (!closed) {
            stream.emit('data', self.data)
            stream.close()
        }
    })
    return stream
}