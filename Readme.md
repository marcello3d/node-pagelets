Pagelets
==============

Pagelets is a node.js framework for describing web pages in terms of realtime hierarchical fragments.

Each pagelet consists of a URL route, a template, and a data source.

There are three main modular components that orchestrate this:

* The Router --- maps urls to pagelets
* The Transporter --- connects the client to the server
* The Templater --- maps data to HTML/DOM

In addition, most apps will want:
* Realtime Models + Delta Operations
* Cache Control

These would integrate into the Transporter layer to allow for streaming content.

Each component consists of client-side and server-side code. They can be swapped out with a different implementation
(as they are all very opinionated).


API: EXPERIMENTAL
================

The Router
----------
The router maps arbitrary URLs to pagelets.

API:
```js

```


Templating Engine
-----------------
The templating engine is in charge of associating the data model to HTML on the screen.

Server API:
```js
// This method should take a pagelet definition and compile/transfer and template information needed by the client API
// it should return an array of any directly referenced pagelet defined in this pagelet
templater.compile = function(pagelet) {
    pagelet.options // access definition of original pagelet spec
    pagelet.spec // store toSource-compatible information to send to client for pagelet spec
    return [] // array of hrefs
}
```

Browser API:
```js

// Constructor
function Templater(getPagelet) {
    // getPagelet returns a Pagelet instance for a given url
    this.getPagelet = getPagelet
}

// Class method
Templater.prototype.show = function(url) {
    var pagelet = this.getPagelet(url)
    // do your stuff
}
```


Model
-----

Browser and Server API:
```js
model.set(path, newValue) // sets a particular path to the given value
model.set(newValue) // replaces entire value
model.update(path) // triggers update event
model.get() // returns current value
model.on('set', function(path, newValue) { ... }) // path is '' for root
model.on('update', function(path) { ... }) // path is '' for root

```

Transport Layer
---------------

Browser API:
```js
module.exports = function(network, cache, Model) {
    return {
        getRoutes: function(url, routesCallback) {
            // retrieve routes required to render url then call routesCallback(error, routes)
        },
        getData: function(url, model) {
            // retrieve data for url and store it in the model, streaming updates if supported
            return function disconnect() {
                // stop streaming updates when this function is called
            }
        }
    }
}
```



Cache Control Layer
-------------------


Browser API:
```js
// returns a cached value for url (cache options can be specified however you like in routeSpec)
//   if there is no cached value, resultCallback() can be called to generate the value
cache.get(url, routeSpec, resultCallback)
```




License
=======
Open source software under the [zlib license](LICENSE).