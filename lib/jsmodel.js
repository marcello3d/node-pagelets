module.exports = function Model() {
    var data = {}
    var listeners = {
        set:[],
        update:[],
        delta:[]
    }
    this.applyDelta = function(delta) {
        if ('set' in delta) {
            this.set(delta.set, delta.value)
        } else if ('update' in delta) {
            this.update(delta.update)
        }
    }
    this.get = function(path) {
        if (arguments.length === 0) { return data }
        var o = data
        var split = path.split(/\./);
        for (var i=0; i<split.length; i++) {
            o = o[split[i]]
            if (!o) { return null }
        }
        return o
    }
    this.update = function(path) {
        listeners.update.forEach(function(listener) {
            listener(path || '')
        })
    }
    this.set = function(path, newValue) {
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
    this.on = function(type, onListener) {
        listeners[type].push(onListener)
    }
    this.off = function(type, offListener) {
        listeners[type] = listeners[type].filter(function(listener) {
            return listener !== offListener
        })
    }
    this.emit = function(type) {
        var args = Array.prototype.slice.apply(arguments,1)
        listeners[type].forEach(function(listener) {
            listener.apply(null, args)
        })
    }

    this.on('set', function(path, value) {
        this.emit('delta', {
            set:path,
            value:value
        })
    })
    this.on('update', function(path) {
        this.emit('delta', {
            update:path
        })
    })
}