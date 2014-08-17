var cb = require('couchbase');
var q = require('q');
var mapper = require('./src/mapper');
/**
 * Initialize the couchbase connection
 */
module.exports = function(config) {
  var result = q.defer;
  var cnx = new couchbase.Connection(config, function(err) {
    if (err) {
      result.reject(err);
    } else {
      /**
       * The couchbase orm
       */
      result.resolve({
        mappers: {},
        /**
         * Declare a new mapper
         */
        declare: function(ns, options) {
          mappers[ns] = mapper(options);
          return mappers[ns];
        },
        /**
         * Gets a mapper
         */
        get: function(ns) {
          return this.mappers[ns];
        }
      });
    }
  };
  return result.promise;
};