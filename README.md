# Sofa the Couchbase ODM

Sofa ODM is a tiny & simplistic ODM for Couchbase that will help you to build
a business model layer with ease, and without having to deal with technicals
aspects of Couchbase like views and requesting.

 * CRUD operations
 * Getters & Setters on records properties
 * Validating data before saving it
 * Filtering and paginations
 * Setup views and helpers for filtering (support also customized views)
 * Mappers definition are compliant with JSON Schema Definition
 * Using Promises API and EventEmitter

*Current version: [v/0.1.6][dist]*

[![Build Status](https://travis-ci.org/ichiriac/sofa-odm.svg)](https://travis-ci.org/ichiriac/sofa-odm)
[![Dependency Status](https://david-dm.org/ichiriac/sofa-odm.svg)](https://david-dm.org/ichiriac/sofa-odm)
[![Coverage Status](https://coveralls.io/repos/ichiriac/sofa-odm/badge.png?branch=master)](https://coveralls.io/r/ichiriac/sofa-odm?branch=master)

## Getting started

```sh
npm install sofa-odm --save
```

## Sample code

```js
var sofa = require('sofa-odm');
var session = new sofa();
// handles all errors
session.on('error', function(err) {
  console.error(err);
});
// declare a user mapper attached to current session
var users = session.declare('user', {
  // declare properties
  properties: {
    name: {
      type: 'string',       // data type : string, number, boolean, array, object
      validate: [4, 64]     // validators, depends on data type
    },
    email: {
      type: 'string',
      validate: /S+@S+\.S+/,
      unique: true
    },
    password: {
      type: 'string',
      validate: [6, 24]
    }
  }
});
// connect to couchbase
session.connect({
  // connection parameters
  host: 'localhost:8091',
  bucket: 'default'
}).then(function() {
  // creates a new entry
  var john = users.create({
    name: 'John Doe',
    email: 'john@doe.com',
    password: 'secret'
  });
  // saves the active record
  john.save()
    // use a email view to find the user
    .then(function() {
      return users.find('email', 'john@doe.com');
    })
    // deletes the first found record
    .then(function(result) {
      return result.rows[0].remove();
    })
    .done()
  ;
}).done();
```

#Misc

This code is distribute under The MIT License (MIT), authored by Ioan CHIRIAC.
