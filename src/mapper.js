var extend = require('extend');
var q = require('q');
/**
 * Defines a mapper
 */
module.exports = function(manager, namespace, options) {
  var mapper = {
    namespace: namespace,   
    options: extend(true,
      // default options
      {
        type:           namespace,
        autoincrement:  true,
        fields:         {},
        record:         {
          beforeSave: function() { return true; }
          ,afterSave: function() { return true; }
          ,beforeRemove: function() { return true; }
          ,afterSave: function() { return true; }
        }
      }
      , options
    ),
    /**
     * Finds data from the specified resultset
     */
    find: function(view, criteria) {
      var result = q.defer();
      if (criteria instanceof Array) {
        criteria = {
          body: { keys: criteria }
        };
      } else if (!(criteria instanceof Object)) {
        criteria = {
          body: { key: criteria }
        };
      }
      criteria = extend(true, {
        limit: 10,
        include_docs: true,
        skip: 0
      }, criteria);
      manager.cb.view(namespace, view).query(criteria, function(err, data, misc) {
        if (err) {
          result.reject(err);
        } else {
          result.resolve(
            resultset.deserialize(view, criteria, data, misc)
          );
        }
      });
      return result.promise
    },
    /**
     * Creates a new record
     */
    create: function(doc) {
      return record.deserialize(doc);
    }
  };
  for(var fieldName in mapper.options.fields) {
    mapper.options.fields[fieldName] = require('./field')(
      fieldName,
      mapper.options.fields[fieldName]
    );
  }
  // record manager
  var record = require('./record')(manager, mapper);
  // resultset manager
  var resultset = require('./resultset')(manager, mapper);
  return mapper;
};