var Listenable = require('listenable')

module.exports = SimpleModel

function SimpleModel(data) {
    this.data = data || {}
    this.listenable = new Listenable
    this.closed = false
}

SimpleModel.prototype.type = 'simple'
SimpleModel.prototype.update = function(data) {
    if (arguments.length === 1) {
        this.data = data
    }
    if (this.data !== undefined) {
        this.listenable.emit('update')
    }
}
SimpleModel.prototype.close = function() {
    this.closed = true
    this.listenable.emit('close')
}
SimpleModel.prototype.readStream = function(tag) {
    var stream = new Listenable
    var self = this
    var closed

    function sendUpdate() {
        if (!closed) {
            stream.emit('data', self.data)
            if (self.closed) {
                stream.close()
            }
        }
    }
    function onClose() {
        stream.close()
    }
    self.listenable.on('update', sendUpdate)
    self.listenable.on('close', onClose)
    stream.close = function() {
        console.log("Simple model: closing stream")
        if (!closed) {
            closed = true
            self.listenable.off('update', sendUpdate)
            self.listenable.off('close', onClose)
            stream.emit('close')
        }
    }
    if (this.data !== undefined) {
        process.nextTick(sendUpdate)
    }
    return stream
}