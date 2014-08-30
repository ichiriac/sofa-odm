var extend = require('extend');
var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var uuid = require('node-uuid');

/**
 * Initialize a mapper class for the specified manager
 */
module.exports = function(manager) {
  /**
   * Defines a new mapper instance into the specified manager
   */
  var mapper = function(namespace, options) {
    var self = this;
    // parent constructor call
    EventEmitter.call(this);
    // default options
    this.options = extend(true,
      {
        type:           namespace,
        autoincrement:  true,
        properties:     {},
        views:          {},
        // register factories
        factory: {
          property:     manager.options.factory.property(manager, this),
          record:       manager.options.factory.record(manager, this, options.record || {}),
          resultset:    manager.options.factory.resultset(manager, this)
        }
      }
      , options
    );
    // initialize fields properties
    for(var name in this.options.properties) {
      this.options.properties[name] = new this.options.factory.property(
        this.options.properties[name], name
      );
      // behaviour decorator
      for(var i = 0; i < manager.options.behaviours.length; i++) {
        this.options.properties[name] = manager.options.behaviours[i].apply(
          manager, [
            this, this.options.properties[name], name
          ]
        );
      }
    }
    // initialize views
    for(var name in this.options.views) {
      var view = this.options.views[name];
      // handle map function
      if (!view.hasOwnProperty('map')) {
        view.map = 
          'function(doc, meta) {\n'
          + '\tif(doc._type && doc._type === ' + JSON.stringify(this.options.type) + ') {\n\t\t'
        ;
        if (view.fields.length > 1) {
          view.map += 'emit([doc.' + view.fields.join(', doc.') + '], null);';
        } else {
          view.map += 'emit(doc.' + view.fields[0] + ', null);';
        }
        view.map += '\n\t}\n}';
      } else if (view.map instanceof Function) {
        view.map = view.map.toString();
      }
      // handle finder
      if (view.find instanceof Function) {
        this[name] = view.find;
      } else {
        (function(viewName) {
          self[viewName] = function() {
            return self.find(viewName, arguments.length > 1 ? arguments : arguments[0]);
          };
        })(name);
      }
    }
    // chain events to manager
    this.on('error', function(err) { manager.emit('error', err); });
    this.on('save', function(record) { manager.emit('save', record); });
    this.on('saved', function(record) { manager.emit('saved', record); });
    this.on('remove', function(record) { manager.emit('remove', record); });
    this.on('removed', function(record) { manager.emit('removed', record); });
    // registers itself into the manager
    manager.mappers[namespace] = this;
    manager.emit('declare', this);
  };
  util.inherits(mapper, EventEmitter);

  /**
   * Finds data from the specified resultset
   */
  mapper.prototype.find = function(view, criteria) {
    var result = q.defer();
    var self = this;
    // handling criteria parameters
    if (criteria instanceof Array) {
      if (criteria.length > 1) {
        criteria = {
          keys: criteria
        };
      } else {
        criteria = {
          key: criteria[0]
        };
      }
    } else if (!(criteria instanceof Object)) {
      criteria = {
        key: criteria
      };
    }
    // set criteria default options :
    criteria = extend(true, {
      limit: 10,            // by default limit to 10 first entries
      include_docs: true,   // also retrieve document contents to populate records
      skip: 0               // pagination
    }, criteria);
    // request :
    manager.cb.view(this.options.type, view, criteria).query(function(err, data, misc) {
      if (err) {
        result.reject(err);
        self.emit('error', err);
      } else {
        var resultset = new self.options.factory.resultset(
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
    return result.promise;
  };
  /**
   * Creates a new record
   */
  mapper.prototype.create = function(doc) {
    return new this.options.factory.record(doc);
  };
  /**
   * Retrieves the next sequence id
   */
  mapper.prototype.nextId = function() {
    var result = q.defer();
    var self = this;
    if (this.options.autoincrement == true) {
      manager.cb.incr(
        'seq.' + this.options.type, 
        {initial: 1, offset: 1},
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
    } else {
      var id = uuid.v4();
      result.resolve(id);
      self.emit('next', id);
    }
    return result.promise;
  };
  /**
   * Automatically creates views into couchbase
   */
  mapper.prototype.setup = function() {
    var result = q.defer();
    var docs = { views: {} };
    var found = false;
    var self = this;
    for(var name in this.options.views) {
      var view = this.options.views[name];
      docs.views[name] = {};
      if (view.hasOwnProperty('map')) {
        found = true;
        docs.views[name].map = view.map;
      }
      if (view.hasOwnProperty('reduce')) {
        found = true;
        docs.views[name].reduce = view.reduce;
      }
    }
    if (found) {
      manager.cb.setDesignDoc(this.options.type, docs, function(err) {
        if (err) {
          result.reject(err);
          self.emit('error', err);
        } else {
          result.resolve(docs);
          self.emit('setup', docs);
        }
      });
    } else result.resolve(false);
    return result.promise;
  };
  // returns the mapper class
  return mapper;
};