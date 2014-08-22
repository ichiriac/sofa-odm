var extend = require('extend');
var q = require('q');
/**
 * Defines a mapper
 */
module.exports = function(manager, namespace, options) {
  var mapper = {
    options: extend(true,
      // default options
      {
        type:           namespace,
        autoincrement:  true,
        fields:         {},
        views:          {},
        record:         {
          beforeSave: function() { return true; }
          ,afterSave: function() { return true; }
          ,beforeRemove: function() { return true; }
          ,afterRemove: function() { return true; }
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
      criteria = extend(true, {
        limit: 10,
        include_docs: true,
        skip: 0
      }, criteria);
      manager.cb.view(namespace, view, criteria).query(function(err, data, misc) {
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
    },
    /**
     * Automatically creates 
     */
    setup: function() {
      var result = q.defer();
      var docs = { views: {} };
      var found = false;
      for(var viewName in mapper.options.views) {
        var view = mapper.options.views[viewName];
        docs.views[viewName] = {};
        if (view.hasOwnProperty('map')) {
          found = true;
          docs.views[viewName].map = view.map;
        }
        if (view.hasOwnProperty('reduce')) {
          found = true;
          docs.views[viewName].reduce = view.reduce;
        }
      }
      if (found) {
        manager.cb.setDesignDoc(mapper.options.type, docs, function(err) {
          if (err) {
            result.reject(err);
          } else {
            result.resolve(docs);
          }
        });
      } else result.resolve(false);
      return result.promise;
    }
  };
  // initialize fields properties
  for(var fieldName in mapper.options.fields) {
    mapper.options.fields[fieldName] = require('./field')(
      fieldName,
      mapper.options.fields[fieldName]
    );
    if (mapper.options.fields[fieldName].meta.unique) {
      mapper.options.views[fieldName] = {
        type: 'unique', fields: [fieldName]
      };
    } else if (mapper.options.fields[fieldName].meta.index) {
      mapper.options.views[fieldName] = {
        type: 'index', fields: [fieldName]
      };
    }
  }
  // initialize views
  for(var viewName in mapper.options.views) {
    var view = mapper.options.views[viewName];
    // handle map function
    if (!view.hasOwnProperty('map')) {
      view.map = 
        'function(doc, meta) {\n'
        + '\tif(doc._type && doc._type === ' + JSON.stringify(mapper.options.type) + ') {\n\t\t'
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
      mapper[viewName] = view.find;
    } else {
      (function(viewName) {
        mapper[viewName] = function() {
          return this.find(viewName, arguments.length > 1 ? arguments : arguments[0]);
        };
      })(viewName);
    }
  }
  // record manager
  var record = require('./record')(manager, mapper);
  // resultset manager
  var resultset = require('./resultset')(manager, mapper);
  return mapper;
};