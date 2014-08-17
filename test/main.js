var assert = require('assert');
describe('test main api', function() {
  it('should connect to couchbase', function(done) {
    require('../main')({
      // default options
    }).then(function(api) {
      assert(typeof api.declare === 'function', 'should have declare function');
      assert(typeof api.get === 'function', 'should have get function');
      assert(typeof api.cb === 'object', 'should have cb object');
      done();
    }).done();
  });
  it('should not connect', function(done) {
    require('../main')({
      bucket: 'unknown'
    }).then(function() {
      assert(false, 'should not be connected to "unknown" bucket !');
    }, function(err) {
      done();
    }).done();
  });
});