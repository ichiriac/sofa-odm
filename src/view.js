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
    var checkUnique = [];
    var self = this;
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
      if (view.hasOwnProperty('type') && view.type == 'unique') {
        checkUnique.push([name, view.properties]);
      }
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
    if (checkUnique.length > 0) {
      // check unique entries before save
      mapper.options.record.save = function(parent) {
        var result = q.defer();
        var checks = [];
        var record = this;
        for(var i = 0; i < checkUnique.length; i++) {
          checks.push(self.isUnique(mapper, record, checkUnique[i][0], checkUnique[i][1]));
        }
        q.all(checks).then(function() {
          return parent.apply(record, []);
        }).then(function(data) {
          result.resolve(data);
        }, function(err) {
          result.reject(err);
        }).done();
        return result.promise;
      };
    }
  };

  /**
   * Helper that checks if the entry values are unique
   */
  view.prototype.isUnique = function(mapper, record, view, columns) {
    var result = q.defer();
    var args = [];
    for(var i = 0; i < columns.length; i++) {
      var name = columns[i];
      args.push( 
        record.hasOwnProperty(name) ? 
          mapper.options.properties[name].unserialize(record[name]) : null 
      );
    }
    mapper[view]({
      key: args,
      limit: 1
    }).then(function(items) {
      if ( 
        !items.rows[0] ||
        items.rows[0].getId() == record.getId()
      ) {
        result.resolve(true);
      } else {
        result.reject(new Error(
          'Unique ' + view + ' constraint failed with [' 
          + columns.join(', ') + '], document "' 
          + items.rows[0].getId() + '" conflicts'
        ));
      }
    }, function(err) {
      result.reject(err);
    }).done();
    return result.promise;
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