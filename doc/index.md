# Quick Start Guide

## Install

This package is available on NPM, so you can easily add it to you NodeJS project :

```sh
npm install sofa-odm --save
```

## Bootstrap

To bootstrap Sofa, you need to create a session (that handles records) and to
connect to bootstrap.

```js
  var session = new require('sofa-odm')();
  session.connect({
    host: 'localhost:8091',
    bucket: 'default'
  }).then(function() {
    // ready to do some stuf here !
  }).done();
```

## Your first model

To keep things clean, define a mapper into a new file (user.js) :

```js
module.exports = function(session) {
  return session.declare('users', {
    properties: {
      name: 'string',
      email: {
        type: 'string',
        unique: true
      }
    }
  });
};
```

And once you when you will be connected, declare your mapper :

```js

  var session = new require('sofa-odm')();
  session.connect({
    host: 'localhost:8091',
    bucket: 'default'
  }).then(function() {
    require('./model/user')(session);
  }).done();

```

## Your first CRUD actions

We continue with the previous code, once connected, we will create, save 
and delete an user :

```js

  var session = new require('sofa-odm')();
  session.connect({
    host: 'localhost:8091',
    bucket: 'default'
  }).then(function() {
    var users = require('./model/user')(session);
    var john = users.create({
      name: 'John Doe',
      email: 'john@doe.com'
    });
    john.save().then(function() {
      console.log('User created !');
      return john.remove();
    }).then(function() {
      console.log('User deleted !');
    }).done();
  }).done();

```