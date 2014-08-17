var assert = require('assert');

describe('test mapper api', function() {
  var couchbase;
  it('should declare', function(done) {
    require('../main')().then(function(api) {
      couchbase = api;
      var test = couchbase.declare('test', {
        fields: {
          foo: {
            type: 'string',
            required: true,
            index: true
          },
          bar: {
            type: 'number'
          }
        }
      });
      // check the api
      assert(test.create instanceof Function);
      assert(test.find instanceof Function);
      assert(test.setup instanceof Function);
      assert(test.options.fields.foo.validate.type instanceof Function);
      assert(test.options.fields.foo.validate.contents instanceof Function);
      assert(test.options.type === 'test');
      // setup the couchbase server
      test.setup().then(function() {
        done();
      }).done();
    }).done();
  });
  it('should create some data', function(done) {
    var entry = couchbase.get('test').create({
      foo: 'oof', bar: 123
    });
    assert(entry.foo === 'oof');
    assert(entry.bar === 123);
    assert(entry._id === false);
    entry.save().then(function() {
      assert(entry._id !== false, 'should have an ID');
      done();
    }).done();
  });
  it('should find some data', function(done) {
    couchbase.get('test').find('foo', 'oof').then(function(results) {
      assert(results.length > 0);
      done();
    }).done();
  });
});