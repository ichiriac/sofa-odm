var q = require('q');
var cb = require('couchbase');

/**
 * Defines the couchbase driver
 */
module.exports = function(manager) {
  return {
    cb: null,
    mock: false,
    /** Connects **/
    connect: function(options, result) {
      if (this.cb) this.shutdown();
      var cnx = {
        host: options.host,
        bucket: options.bucket ? options.bucket : options.database
      };
      var builder = cb.Connection;
      var self = this;
      this.mock = false;
      if (options.params.mock) {
        builder = cb.Mock.Connection;
        this.mock = true;
      }
      this.cb = new builder(cnx, function(err) {
        if (err) {
          result.reject(err);
          manager.emit('error', err);
          self.shutdown();
        } else {
          result.resolve(manager, self);
          manager.emit('connect', manager, self);
        }
      });
      if (this.mock) {
        result.resolve(manager, self);
        manager.emit('connect', manager, self);
      }
      return result;
    }
    /** Close the connection **/
    ,shutdown: function(result) {
      if (this.cb) {
        this.cb.shutdown();
        this.cb = null;
        manager.emit('disconnect', manager);
      }
      if (result) result.resolve(manager);
      return result;
    }
    /** Defines indexes **/
    ,setup: function(view, result) {
      if (!this.cb) {
        throw new Error('Drivers is not connected on couchbase');
      }
      var docs = { views: {} };
      var found = false;
      for(var name in view.views) {
        var v = view.views[name];
        if (
          v.hasOwnProperty('map') ||
          v.hasOwnProperty('reduce')
        ) {
          found = true;
          docs.views[name] = {};
          if (v.hasOwnProperty('map')) {
            docs.views[name].map = v.map;
          }
          if (v.hasOwnProperty('reduce')) {
            docs.views[name].reduce = v.reduce;
          }
        }
      }
      if (found) {
        this.cb.setDesignDoc(view.mapper.options.type, docs, function(err) {
          if (err) {
            result.reject(err);
            view.mapper.emit('error', err);
          } else {
            result.resolve(docs);
            view.mapper.emit('setup', docs);
          }
        });
      } else result.resolve(false);
      return result;
    }
    /** Increment the specified key **/
    ,incr: function(self, key, options, result) {
      if (!result) {
        result = options;
        options = null;
      }
      this.cb.incr(
        key,
        options || {initial: 1, offset: 1},
        function(err, data) {
          if (err) {
            result.reject(err);
            self.emit('error', err);
          } else {
            result.resolve(data.value);
            self.emit('next', data.value);
          }
        }
      );
    }
    /** Requests some data **/
    ,request: function(self, view, criteria, result) {
      this.cb.view(self.options.type, view, criteria).query(function(err, data, misc) {
        if (err) {
          result.reject(err);
          self.emit('error', err);
        } else {
          var resultset = new self.factory.resultset(
            data, {
              view: view,
              misc: misc,
              criteria: criteria
            }
          );
          result.resolve(resultset);
          self.emit('find', resultset);
        }
      });
      return result;
    }
    /** Writes the specified document **/
    ,set: function(self, key, object, wait, result) {
      this.cb.set(
        key, object,
        wait ? { persist_to: 1, replicate_to: 0, spooled: false } : {},
        function(err, data) {
          if (err) {
            result.reject(err);
            object.emit('error', err);
            self.emit('error', err);
          } else {
            result.resolve(object);
            object.emit('saved', self);
            self.emit('saved', self);
          }
        }
      );
      return result;
    }
    /**Removes the specified document **/
    ,remove: function(self, mapper, key, wait, result) {
      this.cb.remove(key,
        wait ? { persist_to: 1, replicate_to: 0, spooled: false } : {},
        function(err) {
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
        }
      );
      return result;
    }
  };
};