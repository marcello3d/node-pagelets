Pagelet Engine
==============

Pagelet is a node.js framework for describing web pages in terms of hierarchical fragments.

Each pagelet consists of a URL route, a template, and a data source.

There are three main modular components that orchestrate this:

* The URL Router --- maps urls to pagelets
* The Data-Transport Layer --- connects the client to the server
* The Templating Engine --- maps data to HTML/DOM

In addition, most apps will want:
* A Data Model Engine
* A Cache Control/Data Versioning Layer

These work in conjunction with the Data-Transport layer to manage data efficiently.

Each component consists of client-side and server-side code. They can be swapped out with a different implementation
(as they are all very opinionated).







URL Router
==========
The URL router allows you to map arbitrary URLs to pagelets.

API:
```js

```




Templating Engine
=================
The templating engine is in charge of associating the data model to HTML on the screen.


Model
=====

API:
```js
model.set(path, newValue) // sets a particular path to the given value
model.set(newValue) // replaces entire value
model.get() // returns current value
model.on('set', function(path, newValue) { ... }) // path is '' for root
model.on('update', function(path) { ... }) // path is '' for root

```


Cache Control Layer
===================

```js
// returns a cached value for url (cache options can be specified however you like in routeSpec)
//   if there is no cached value, resultCallback() can be called to generate the value
cache.get(url, routeSpec, resultCallback)
```




License
-------
Open source software under the [zlib license](LICENSE).