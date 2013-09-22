var ractive = require('ractive')
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
    var template = Ractive.parse(fs.readFileSync(this.viewsPath + '/' + pagelet.options.template, 'utf8'))
    pagelet.spec.ract = template

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


