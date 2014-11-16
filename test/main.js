var assert = require('assert');

describe('test main api', function() {
  var couchbase;
  it('should connect to couchbase', function(done) {
    require('./connector')().then(function(api) {
      assert(typeof api.declare === 'function', 'should have declare function');
      assert(typeof api.get === 'function', 'should have get function');
      assert(typeof api.has === 'function', 'should have has function');
      assert(typeof api.connect === 'function', 'should have has function');
      assert(typeof api.cb === 'object', 'should have cb object');
      couchbase = api;
      done();
    }).done();
  });
  it('should declare', function() {
    assert(couchbase.declare('test', {}) instanceof Object, 'Should be an object');
  });
  it('should has', function() {
    assert(couchbase.has('test'));
  });
  it('should not has', function() {
    assert(!couchbase.has('something'));
  });
  it('should get', function() {
    assert(couchbase.get('test') instanceof Object);
  });
  it('should get an error', function() {
    try {
      assert(couchbase.get('something') && false);
    } catch(e) {
      assert(e instanceof Error);
    }
  });
  it('should get an error from declare', function() {
    try {
      assert(couchbase.declare('test') && false);
    } catch(e) {
      assert(e instanceof Error);
    }
  });
  it('should not connect', function(done) {
    couchbase.on('error', function(e) {
      done();
    });
    couchbase.disconnect().then(function() {
      return couchbase.connect({
        host: 'demo.123:8091'
        , bucket: 'unknown'
        , params : {
            mock: false
        }
      });
    }).then(function() {
      assert(false, 'should not be connected to "unknown" bucket !');
    }, function() {
      // ignore error from promise, use the event
      assert(true);
    }).done();
  });
});