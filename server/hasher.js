module.exports = Hasher
function Hasher(path) {
    this.path = path
    this.regex = new RegExp(path.replace(/([^a-z0-9])/gi,"\\$1").replace(/(\\#)+/, '[^/]+'))
}
Hasher.prototype.matches = function(url) {
    return this.current === url || this.regex.test(url)
}
Hasher.prototype.setHash = function(hash) {
    return this.current = this.path.replace(/#+/, hash)
}
