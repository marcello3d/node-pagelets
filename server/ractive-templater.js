var Ractive = require('ractive')
var fs = require('fs')


/**
 * Compiles a template
 * @param templatePath
 */
module.exports = function (templatePath) {
    var compiled = compile(templatePath)
    return function(route) {
        route.browser.ract = compiled.template
        if (route.options.clientEvents) {
            route.browser.ractEv = route.options.clientEvents
        }
        return compiled.hrefs
    }
}

function compile(templatePath) {
    try { require(templatePath) } catch (e) {}
    var template = Ractive.parse(fs.readFileSync(templatePath, 'utf8'))
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
    return {
        template: template,
        hrefs: pageletHrefs
    }
}