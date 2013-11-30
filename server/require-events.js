module.exports = function(path) {
    var fakeFunction = function() {}
    fakeFunction.toString = function() {
        return 'require('+JSON.stringify(path)+')'
    }
    return fakeFunction
}