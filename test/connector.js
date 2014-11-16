// this is an helper for creating a new session
var sofa = require('../main');
var session = new sofa();
module.exports = function(mock) {
  session.mappers = {};
  session.removeAllListeners();
  return session.connect(
    'couchbase://localhost:8091/tests?mock=' + (
      (typeof mock === 'undefined' ? true : mock) ? 'true' : 'false'
    )
  );
};