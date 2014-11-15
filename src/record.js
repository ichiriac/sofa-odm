var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * Defines a record
 */
module.exports = function(manager, mapper, body) {

  // record constructor
  var record = function(doc) {
    // reserved field _id
    this._id = false;
    // sets values
    for(var i in doc) {
      if (mapper.options.properties.hasOwnProperty(i)) {
        this[i] = mapper.options.properties[i].unserialize(doc[i]);
      } else {
        this[i] = doc[i];
      }
    }
  };
  util.inherits(record, EventEmitter);

  // declare cached variables (not serialized)
  Object.defineProperty(record.prototype, "__buffer", {
    enumerable: false,
    configurable: false,
    writable: true,
    value: {}
  });

  // Hide the EventEmitter property, avoid its serialisation
  Object.defineProperty(record.prototype, "_events", {
    enumerable: false,
    configurable: false,
    writable: true,
    value: {}
  });

  // handles getters & setters
  for(var name in mapper.options.properties) {
    var property = mapper.options.properties[name];
    if (
      property.hasOwnProperty('get')
      || property.hasOwnProperty('set')
    ) {
      Object.defineProperty(record.prototype, name, {
          get: property.hasOwnProperty('get') ? property.get : function() {
              return this.__buffer[name];
          },
          set: property.hasOwnProperty('set') ? property.set : function(value) {
              this.__buffer[name] = value;
          },
          enumerable: true,
          configurable: false
      });
    }
  }


  // Gets the record ID
  record.prototype.getId = function() {
    return mapper.options.autoincrement ?
      mapper.options.type + '.' + this._id : this._id
    ;
  };

  // saves the current record
  record.prototype.save = function(wait) {
    var self = this;
    if (!this._id) {
      return mapper.nextId().then(function(id) {
        self._id = id;
        return self.save(wait);
      });
    } else {
      var result = q.defer();
      try {
        for(var name in mapper.options.properties) {
          var property = mapper.options.properties[name];
          if (this.hasOwnProperty(name) && this[name] !== null && !property.checkType(this[name])) {
            throw new Error('Unable to validate "' + name + '" type as "' + property.type + '"');
          }
          if (!property.checkContents(this[name])) {
            throw new Error('Unable to validate "' + name + '" contents');
          }
        }
        this.emit('save', this);
        mapper.emit('save', this);
        // reserved field _type
        this._type = mapper.options.type;
        manager.cb.set(mapper, this.getId(), this, wait, result);
      } catch(err) {
        result.reject(err);
        this.emit('error', err);
        mapper.emit('error', err);
      }
      return result.promise;
    }
  };

  // removes the current entry
  record.prototype.remove = function(wait) {
    var result = q.defer();
    var self = this;
    try {
      if (!this._id) throw new Error(
        "Can not remove, the entry is not saved yet"
      );
      this.emit('remove', this);
      mapper.emit('remove', this);
      manager.cb.remove(this, mapper, this.getId(), wait, result);
    } catch(err) {
      result.reject(err);
      this.emit('error', err);
      mapper.emit('error', err);
    }
    return result.promise;
  };

  // extends with custom functions
  for(var name in body) {
    if (body[name] instanceof Function) {
      (function(body, name, record) {
        var parent = record.prototype.hasOwnProperty(name) ? record.prototype[name] : null;
        record.prototype[name] = function() {
          var args = Array.prototype.slice(arguments);
          args.unshift(parent);
          return body[name].apply(this, args);
        };
      })(body, name, record);
    } else {
      record.prototype[name] = body[name];
    }
  }

  // expose the record class
  return record;
};