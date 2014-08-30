var assert = require('assert');

describe('test mapper api', function() {
  var couchbase;
  it('should declare', function(done) {
    require('./connector')().then(function(api) {
      couchbase = api;
      var test = couchbase.declare('test', {
        properties: {
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
      assert(test.options.properties.foo.checkType instanceof Function);
      assert(test.options.properties.foo.checkContents instanceof Function);
      assert(test.options.type === 'test');
      // setup the couchbase server
      test.setup().then(function(views) {
        assert(views != false, "Should have views");
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
    entry.save(true).then(function() {
      assert(entry._id !== false, 'should have an ID');
      done();
    }).done();
  });
  it('should find some data', function(done) {
    couchbase.get('test').find('foo', 'oof').then(function(results) {
      assert(results.length > 0, 'The resultset should have record');
      done();
    }).done();
  });
  
  it('should create multi-indexes', function(done) {
    var multi = couchbase.declare('multi', {
      properties: {
        foo: 'string',
        bar: {
          type: 'string',
          index: true
        },
        baz: {
          type: 'string',
          unique: true
        }
      },
      views: {
        idx1: {
          type: 'index',
          properties: ['foo', 'bar']
        },
        idx2: ['foo', 'baz'],
        idx3: {
          type: 'unique',
          properties: ['foo', 'bar']
        },
        /**
         * No need to check the doc type, done automatically
         */
        idx4: {
          map: function(doc, meta) {
            if (doc._type && doc._type === "multi") {
              // index by the first letter of document
              emit(doc.foo.substring(0, 1), null);
            }
          },
          // call from : couchbase.get('multi').idx4('azerty') ...
          // nb : auto generated if not defined
          find: function(foo) {
            return this.find('idx4', foo.substring(0, 1));
          }
        }
      }
    });
    multi.setup().then(function() {
      assert(multi.idx1 instanceof Function);
      assert(multi.idx2 instanceof Function);
      assert(multi.idx3 instanceof Function);
      assert(multi.idx4 instanceof Function);
      assert(multi.baz instanceof Function);
      assert(multi.bar instanceof Function);
      done();
    }).done();
  });
});