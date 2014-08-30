var q = require('q');

/**
 * Defines a view handler
 */
module.exports = function(manager) {
  /**
   * Constructor
   */
  var view = function(mapper, views) {
    this.mapper = mapper;
    this.views = views;
    var checkUnique = false;
    // initialize each view
    for(var name in this.views) {
      var view = this.views[name];
      // shortcut to declare a list of indexed columns
      if (view instanceof Array) {
        view = this.views[name] = { type: 'index', properties: view };
      }
      // handle map function
      if (!view.hasOwnProperty('map')) {
        view.map = 
          'function(doc, meta) {\n'
          + '\tif(doc._type && doc._type === ' + JSON.stringify(mapper.options.type) + ') {\n\t\t'
        ;
        if (view.properties.length > 1) {
          view.map += 'emit([doc.' + view.properties.join(', doc.') + '], null);';
        } else {
          view.map += 'emit(doc.' + view.properties[0] + ', null);';
        }
        view.map += '\n\t}\n}';
      } else if (typeof view.map === 'function') {
        view.map = view.map.toString();
      } else if (typeof view.map !== 'string') {
        throw new Error('Bad map format for "'+name+'" view, expecting a string or a function');
      }
      if (view.hasOwnProperty('type') && view.type == 'unique') checkUnique = true;
      // handle finder
      if (view.find instanceof Function) {
        mapper[name] = view.find;
      } else {
        (function(viewName) {
          mapper[viewName] = function() {
            return mapper.find(viewName, arguments.length > 1 ? arguments : arguments[0]);
          };
        })(name);
      }
    }
    // handle the unique constraint
    if (checkUnique) {
      // @todo
    }
  };
  
  /**
   * Setup the views
   */
  view.prototype.setup = function() {
    var result = q.defer();
    var docs = { views: {} };
    var found = false;
    var self = this;
    for(var name in this.views) {
      var view = this.views[name];
      if (
        view.hasOwnProperty('map') || 
        view.hasOwnProperty('reduce')
      ) {
        found = true;
        docs.views[name] = {};
        if (view.hasOwnProperty('map')) {
          docs.views[name].map = view.map;
        }
        if (view.hasOwnProperty('reduce')) {
          docs.views[name].reduce = view.reduce;
        }
      }
    }
    if (found) {
      manager.cb.setDesignDoc(this.mapper.options.type, docs, function(err) {
        if (err) {
          result.reject(err);
          self.mapper.emit('error', err);
        } else {
          result.resolve(docs);
          self.mapper.emit('setup', docs);
        }
      });
    } else result.resolve(false);
    return result.promise;
  };

  return view;
};