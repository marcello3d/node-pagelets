module.exports = Listenable

function Listenable() {
    this.listeners = {}
}
Listenable.prototype.on = function(type, listener) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(listener)
}
Listenable.prototype.once = function(type, listener) {
    var self = this
    function wrappedListener() {
        self.off(type, wrappedListener)
        listener.apply(null, arguments)
    }
    this.on(type, wrappedListener)
}
Listenable.prototype.off = function(type, listener) {
    if (this.listeners[type]) {
        this.listeners[type] = this.listeners[type].filter(function(l) {
            return l !== listener
        })
    }
}
Listenable.prototype.emit = function(type) {
    if (this.listeners[type]) {
        var args = [].slice.call(arguments, 1)
        this.listeners[type].forEach(function(listener) {
            listener.apply(null, args)
        })
    }
}