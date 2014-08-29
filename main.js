var cb = require('couchbase');
var q = require('q');
var extend = require('extend');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * The manager class
 */
var manager = function(options) {
  // parent constructor call
  EventEmitter.call(this);
  // Handles default options
  this.options = extend(true,
      {
        // list of behaviour handlers
        behaviours: ['index', 'required', 'unique'],
        // list of property types validators
        validators: {
          'string': 'string',
          'number': 'number',
          'object': 'object', 
          'date': 'date', 
          'boolean': 'boolean', 
          'array': 'array'
        },
        // factories
        , factory: {
          mapper:     require(__dirname + '/src/mapper')(this),
          record:     require(__dirname + '/src/record'),
          resultset:  require(__dirname + '/src/resultset'),
          property:   require(__dirname + '/src/property')
        }
      }, options
  );
  // registers behaviours
  for(var i = 0; i < this.options.behaviours.length; i++) {
    var behaviour = this.options.behaviours[i];
    if (behaviour instanceof String) {
      this.options.behaviours[i] = require(
        behaviour[0] == '.' || behaviour[0] == '/' ?
          behaviour : __dirname + '/src/behaviours/' + behaviour
      )(this);
    }
  }
  // register validators
  for(var i in this.options.validators) {
    var validator = this.options.validators[i];
    if (validator instanceof String) {
      this.options.validators[i] = require(
        validator[0] == '.' || validator[0] == '/' ?
          validator : __dirname + '/src/validators/' + validator
      )(this);
    }
  }
  // registers events
  if (this.options.hasOwnProperty('on')) {
    for(var event in this.options.on) {
      this.on(event, this.options.on[event]);
    }
  }
  // connects to couchbase
  if (this.options.hasOwnProperty('couchbase')) {
    this.connect(this.options.couchbase).done();
  }
  // declare registered mappers
  this.mappers = {};
  if(this.options.hasOwnProperty('mappers')) {
    for(var name in this.options.mappers) {
      this.declare(name, this.options.mappers[name]);
    }
  }
};
util.inherits(manager, EventEmitter);

/**
 * Connects to couchbase
 */
manager.prototype.connect = function(options) {
  var result = q.defer();
  var self = this;
  this.cb = new cb.Connection(options || {}, function(err) {
    if (err) {
      result.reject(err);
      self.emit('error', err);
      self.cb = null;
    } else {
      result.resolve(self);
      self.emit('connect', self);
    }
  });
  return result.promise;
};

/**
 * Declare a new mapper
 */
manager.prototype.declare = function(namespace, options) {
  if (this.mappers.hasOwnProperty(namespace)) {
    throw new Error(
      'Namespace [' + namespace + '] is already defined !'
    );
  }
  return new this.options.factory.mapper(namespace, options);
};

/**
 * Gets a mapper
 */
manager.prototype.get = function(namespace) {
  if (!this.mappers.hasOwnProperty(namespace)) {
    throw new Error('Namespace [' + namespace + '] is undefined !');
  }
  return this.mappers[namespace];
};

/**
 * Checks if the mapper is defined
 */
manager.prototype.has = function(namespace) {
  return this.mappers.hasOwnProperty(namespace);
};

module.exports = manager;