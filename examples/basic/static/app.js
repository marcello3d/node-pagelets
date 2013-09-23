require('pagelets/browser')({
    router:require('pagelets/browser/router'),
    transporter:require('pagelets/browser/ajax-transporter')(),
    templater:require('pagelets/browser/ractive-templater'),
    cache:require('pagelets/browser/cache'),
    model:require('pagelets/server/jsmodel')
})