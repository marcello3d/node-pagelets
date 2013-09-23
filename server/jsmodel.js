module.exports = function Model(initialData) {
    var data = initialData || {}
    var listeners = {
        set:[],
        update:[],
        delta:[]
    }

    var self = this
    self.applyDelta = function(delta) {
        if ('set' in delta) {
            self.set(delta.set, delta.value)
        } else if ('update' in delta) {
            self.update(delta.update)
        }
    }
    self.get = function(path) {
        if (arguments.length === 0) { return data }
        var o = data
        var split = path.split(/\./);
        for (var i=0; i<split.length; i++) {
            o = o[split[i]]
            if (!o) { return null }
        }
        return o
    }
    self.update = function(path) {
        listeners.update.forEach(function(listener) {
            listener(path || '')
        })
    }
    self.set = function(path, newValue) {
        var oldValue
        if (arguments.length === 1) {
            newValue = path
            oldValue = data
            data = newValue
            listeners.set.forEach(function(listener) {
                listener('', newValue, oldValue)
            })
        } else {
            var o = {0:data}
            var lastKey = 0
            path.split(/\./).forEach(function(key) {
                o = o[lastKey]
                if (!(key in o)) { o[key] = {} }
                lastKey = key
            })
            oldValue = o[lastKey]
            o[lastKey] = newValue
            listeners.set.forEach(function(listener) {
                listener(path, newValue, oldValue)
            })
        }
    }
    self.on = function(type, onListener) {
        listeners[type].push(onListener)
    }
    self.off = function(type, offListener) {
        listeners[type] = listeners[type].filter(function(listener) {
            return listener !== offListener
        })
    }
    self.emit = function(type) {
        var args = Array.prototype.slice.call(arguments,1)
        listeners[type].forEach(function(listener) {
            listener.apply(null, args)
        })
    }
    self.on('set', function(path, value) {
        self.emit('delta', {
            set:path,
            value:value
        })
    })
    self.on('update', function(path) {
        self.emit('delta', {
            update:path
        })
    })
    self.hasDeltaListeners = function() {
        return listeners.delta.length
    }
}