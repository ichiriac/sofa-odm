var assert = require('assert');

describe('test behaviours', function() {

  var couchbase;
  var mapper;

  it('should connect to couchbase', function(done) {
    require('./connector')().then(function(api) {
      couchbase = api;
      mapper = couchbase.declare('behaviour', {
        properties: {
          foo: {
            unique: true
          },
          bar: 'string',
          baz: {
            index: true,
            required: true
          }
        },
        views: {
          fooBar: {
            type: 'unique',
            properties: ['foo', 'bar']
          }
        }
      });
      return mapper.setup();
    }).then(function() {
      // all is OK
      done();
    }).done();
  });

  it('should create an entry', function(done) {
    var hw = mapper.create({
      foo: 'hello',
      bar: 'world',
      baz: 123
    });
    var wh = mapper.create({
      foo: 'world',
      bar: 'hello',
      baz: 456
    });
    hw.save().then(function() {
      return wh.save();
    }).then(function() {
      done();
    }).done();
  });
  
  it('should raise errors', function(done) {
    // test the required property
    var req = mapper.create({});
    try {
      req.save().then(function() {
        assert(false, 'Should not be saved (required property)');
      }, function() {
        assert(true);
        done();
      }).done();
    } catch(e) {
      assert(true);
      done();
    }
    // test the unique property
    
  });

});