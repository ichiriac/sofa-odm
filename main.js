var manager = require('nodm');

var connect = manager.prototype.connect;
/**
 * The manager connection handler
 */
manager.prototype.connect = function(options) {
  return connect.apply(this, [
    require('./src/driver'), options
  ]);
};
// expose the nodm manager
module.exports = manager;