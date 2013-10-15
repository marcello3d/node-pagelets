var Ractive = require('ractive')
var fs = require('fs')

module.exports = RactiveTemplater

function RactiveTemplater(options) {
    if (!options.viewsPath) {
        throw new Error("Must specify options.viewSrc")
    }
    this.viewsPath = options.viewsPath
}

/**
 * Compiles a template
 * @param pagelet
 * @return {Array} list of referenced pagelet paths
 */
RactiveTemplater.prototype.compile = function(pagelet) {
    if (!pagelet.options.template) {
        return []
    }
    var path = this.viewsPath + '/' + pagelet.options.template
    try { require(path) } catch (e) {}
    var template = Ractive.parse(fs.readFileSync(path, 'utf8'))
    pagelet.browser.ract = template

    var pageletHrefs = []

    if (template.forEach) {
        template.forEach(walkRactiveAST)
    }
    function walkRactiveAST(node) {
        if (node.t) {
            if (node.t === 15 && node.e === 'pagelet') {
                pageletHrefs.push(node.a.href)
            }
            node.f && node.f.forEach && node.f.forEach(walkRactiveAST)
        }
    }
    return pageletHrefs
}


