var q = require('q');
var uuid = require('node-uuid');

/**
 * Defines a record
 */
module.exports = function(manager, mapper) {

  // record constructor
  var record = function(doc) {
    // reserved field _id
    this._id = false;
    // sets values
    for(var i in doc) {
      if (mapper.options.fields.hasOwnProperty(i)) {
        this[i] = mapper.options.fields[i].unserialize(doc[i]);
      } else {
        this[i] = doc[i];
      }
    }
  };

  // saves the current record
  record.prototype.save = function() {
    var self = this;
    if (!self._id) {
      return recordManager.nextId().then(function(id) {
        self._id = id;
        return self.save();
      });
    } else {
      var result = q.defer();
      try {
        for(var fieldName in mapper.options.fields) {
          var field = mapper.options.fields[fieldName];
          if (!field.validate.type(self[fieldName])) {
            throw new Error('Unable to validate "' + fieldName + '" type');
          }
          if (!field.validate.contents(self[fieldName])) {
            throw new Error('Unable to validate "' + fieldName + '" contents');
          }
        }
        if (!mapper.options.record.beforeSave.apply(self, [])) {
          throw new Error('Unable to save the record');
        }
        // reserved field _type
        self._type = mapper.options.type;
        manager.cb.set(
          mapper.options.autoincrement ? mapper.options.type + '.' + self._id : self._id, self,
          function(err, data) {
            if (err) {
              result.reject(err);
            } else {
              if (!mapper.options.record.afterSave.apply(self, [])) {
                throw new Error('Unable to save the record');
              }
              result.resolve(self);
            }
          }
        );
      } catch(e) {
        result.reject(e);
      }
      return result.promise;
    }
  };
  
  // removes the current entry
  record.prototype.remove = function() {
    var result = q.defer();
    var self = this;
    if (this._id) {
      if (!mapper.options.record.beforeRemove.apply(self, [])) {
        throw new Error('Unable to remove the record');
      }
      manager.cb.remove(
        mapper.options.autoincrement ? mapper.options.type + '.' + this._id : this._id
        , function(err) {
        if (err) {
          result.reject(err);
        } else {
          mapper.options.record.afterRemove.apply(self, []);
          result.resolve(self);
        }
      });
    } else {
      result.reject(new Error("Can not remove, the entry is not saved yet"));
    }
    return result.promise;
  };

  // manager
  var recordManager = {
    /**
     * Retrieves the next sequence id
     */
    nextId: function() {
      var result = q.defer();
      if (mapper.options.autoincrement == true) {
        manager.cb.incr(
          'seq.' + mapper.options.type, 
          {initial: 1, offset: 1},
          function(err, data) {
            if (err) {
              result.reject(err);
            } else {
              result.resolve(data.value);
            }
          }
        );
      } else {
        result.resolve(uuid.v4());
      }
      return result.promise;
    },
    /**
     * Deserialize a document into an active record
     */
    deserialize: function(doc) {
      return new record(doc);
    }
  };
  return recordManager;
};