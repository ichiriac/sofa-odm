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
        record:         {}
      }
      , options
    );
    // defines the factories
    this.factory = {
      property:     manager.factory.property(manager, this),
      resultset:    manager.factory.resultset(manager, this)
    };
    // initialize fields properties
    for(var name in this.options.properties) {
      this.options.properties[name] = new this.factory.property(
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
    this.views = new manager.factory.view(this, this.options.views);
    // register record factory
    this.factory.record = manager.factory.record(manager, this, this.options.record);
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
    return manager.cb.request(this, view, criteria, q.defer()).promise;
  };
  /**
   * Creates a new record
   */
  mapper.prototype.create = function(doc) {
    return new this.factory.record(doc);
  };
  /**
   * Retrieves the next sequence id
   */
  mapper.prototype.nextId = function() {
    var result = q.defer();
    var self = this;
    if (this.options.autoincrement == true) {
      manager.cb.incr(this, 'seq.' + this.options.type, result);
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
    return this.views.setup();
  };
  // returns the mapper class
  return mapper;
};