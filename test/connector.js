// this is an helper for creating a new session
var sofa = require('../main');
var session = new sofa();
module.exports = function() {
  session.mappers = {};
  session.removeAllListeners();
  return session.connect({
    host: 'localhost:8091',
    bucket: 'tests'
  });
};