module.exports = function bind(pagelet) {
    var ractive = pagelet.ractive
    var model = pagelet.model
    ractive.set(model.data)
    model.on('data',function(value) {
        ractive.set(value)
    })
    // TODO: reverse binding ??
}