var cb = require('couchbase');
var q = require('q');
var mapper = require('./src/mapper');
/**
 * Initialize the couchbase connection
 */
module.exports = function(config) {
  var result = q.defer;
  new couchbase.Connection(config, function(err) {
    if (err) {
      result.reject(err);
    } else {
      /**
       * The couchbase orm
       */
      result.resolve({
        cb: this;
        mappers: {},
        /**
         * Declare a new mapper
         */
        declare: function(namespace, options) {
          if (this.mappers.hasOwnProperty(namespace)) {
            throw new Error(
              'Namespace [' + namespace + '] is already defined !'
            );
          }
          this.mappers[namespace] = mapper(this, namespace, options);
          return this.mappers[namespace];
        },
        /**
         * Gets a mapper
         */
        get: function(namespace) {
          if (!this.mappers.hasOwnProperty(namespace)) {
            throw new Error('Namespace [' + namespace + '] is undefined !');
          }
          return this.mappers[namespace];
        }
      });
    }
  };
  return result.promise;
};