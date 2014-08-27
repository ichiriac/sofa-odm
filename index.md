---
layout: default
title: NodeJS based CouchBase ODM
---

# Sofa the Couchbase ODM

This library is a tiny & simplistic ODM for Couchbase. 

The project is motivated by the need to handle automatically some basic principles 
that can be found in relational databases like unique fields, auto-incremented keys, 
indexed columns and some basic requesting.

## Install :

```
npm install sofa-odm --save
```

## Functionnalities :

* Document type oriented (like tables on relational databases)
* CRUD operations
* Filtering and paginations
* Validating data before its saved
* Automatically creates views for filtering
* Using Promises api

A lot more can be done to improve this library, but essentials tools are here

## Sample code :

Bootstrap :

```js
require('sofa-odm')({
  // connection parameters
  host: 'localhost:8091',
  bucket: 'default',
  connectionTimeout: 50000
}).then(function(couchbase) {
  // registering models
  require('./models/user')(couchbase);
}).done();
```

A mapper structure :

```js
module.exports = function(couchbase) {
  return couchbase.declare('user', {
    // declare fields
    fields: {
      name: {
        type: 'string',       // data type : string, number, boolean, array, object
        validate: [4, 64]     // contraints, depends on data type
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
};
```

A mapper usage :

```js
// create an active record
var john = couchbase.get('user').create({
  name: 'John Doe',
  email: 'john@doe.com',
  password: 'secret'
});
// saves the active record
john.save()
  // use a email view to find the user
  .then(function() {
    return couchbase.get('user').find('email', 'john@doe.com');
  })
  // deletes the first found record
  .then(function(result) {
    return result.rows[0].remove();
  })
  .done()
;
```

## API :

### Manager

* **declare** (namespace, options) : Declares a new mapper
* **get** (namespace) : Gets the mapper

### Mapper 

* **create** (properties) : Creates a new active record
* **find** (viewname, filter) : Filters the specified view

### Active Record

* **save** : Saves the current record
* **remove** : Removes the current record
