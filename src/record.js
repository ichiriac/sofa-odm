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

  // Gets the record ID
  record.prototype.getId = function() {
    return mapper.options.autoincrement ? 
      mapper.options.type + '.' + this._id : this._id
  };

  // saves the current record
  record.prototype.save = function() {
    var self = this;
    if (!this._id) {
      return mapper.nextId().then(function(id) {
        self._id = id;
        return self.save();
      });
    } else {
      var result = q.defer();
      try {
        for(var name in mapper.options.properties) {
          var property = mapper.options.properties[name];
          if (this.hasOwnProperty(name) && !property.checkType(this[name])) {
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
        manager.cb.set(
          this.getId(), this,
          function(err, data) {
            if (err) {
              result.reject(err);
              self.emit('error', err);
              mapper.emit('error', err);
            } else {
              result.resolve(self);
              self.emit('saved', self);
              mapper.emit('saved', self);
            }
          }
        );
      } catch(err) {
        result.reject(err);
        this.emit('error', err);
        mapper.emit('error', err);
      }
      return result.promise;
    }
  };
  
  // removes the current entry
  record.prototype.remove = function() {
    var result = q.defer();
    var self = this;
    try {
      if (!this._id) throw new Error(
        "Can not remove, the entry is not saved yet"
      );
      this.emit('remove', this);
      mapper.emit('remove', this);
      manager.cb.remove(this.getId(), function(err) {
        if (err) {
          result.reject(err);
          self.emit('error', err);
          mapper.emit('error', err);
        } else {
          // reset the current field ID
          self._id = false;
          result.resolve(self);
          self.emit('removed', self);
          mapper.emit('removed', self);
        }
      });
    } catch(err) {
      result.reject(err);
      this.emit('error', err);
      mapper.emit('error', err);
    }
    return result.promise;
  };
  
  // extends with custom functions
  for(var name in body) {
    record.prototype[name] = body[name];
  }
  
  // expose the record class
  return record;
};