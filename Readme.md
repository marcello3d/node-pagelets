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


Model Stream API
----------------

Model stream is a low-level message stream for sending live updates to a model. The content of the messages is up to the
model implementation.

For example:

A simple implementation could send out the entire model whenever there is a change. For tiny data models (e.g. a hit
counter) or models that change infrequently, this may actually be the most efficient approach.

"Smarter" model implementations can send change operations that update parts of the model as they change. This
would be beneficial for larger data models that change frequently.

An even smarter model implementation can use the version tag feature to support change operations over a longer time
frame. Combined with some type of browser-backed local storage, this might be beneficial for even larger models or
offline syncing.

Server API:
```js
var stream = model.readStream(tag) // return ModelStream starting from scratch or from a given version tag
// ModelStream events
stream.on('data', function(
                    data, // anything you want to send to the client
                    tag // optional version tag for use in future model.readStream calls
                  ) { ... })
stream.once('error', function(error) { ... })
stream.once('close', function() { ... })

// Close the stream, stop sending events, trigger a 'close' event
stream.close()
```

Tags optionally allow you to optimize re-connections and long polling requests. They are opaque to the transporter and
should be compact strings (as they may be sent frequently and will be used for comparisons).

If no tag is specified in `model.readStream()`, then you can assume the client has no data. If you do not recognize a
tag, you should assume the client model has data that needs to be replaced.

Browser API:
```js
model.applyData(data, tag) // apply a data event from a ModelStream, should assign tag to this.lastTag
model.lastTag // retrieve last tag
```



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