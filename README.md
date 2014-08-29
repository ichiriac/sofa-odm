# Sofa the Couchbase ODM

This library is a tiny & simplistic ODM for Couchbase. 

The project is motivated by the need to handle automatically some basic principles 
that can be found MongoDB or in relational databases like : unique fields, auto-incremented keys, 
indexed columns, basic CRUD operations, and classical ORM behaviours (validating data).

## Install :

```
npm install sofa-odm --save
```

## Functionnalities :

* CRUD operations
* Validating data before saving it
* Filtering and paginations
* Setup views and helpers for filtering (support also customized views)
* Mappers definition are compliant with JSON Schema Definition
* Using Promises API and EventEmitter

## Sample code :

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


## Documentation

The documentation can be found at this address : http://ichiriac.github.io/sofa-odm/doc
(work still in progress)

#License

This code is distribute under The MIT License (MIT), authored by Ioan CHIRIAC.