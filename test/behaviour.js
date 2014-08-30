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
            properties: ['baz', 'bar']
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

  // test the required property
  it('should raise required error', function(done) {
    var req = mapper.create({});
    req.save().then(function() {
      assert(false, 'Should not be saved (required property)');
    }, function() {
      assert(true);
      done();
    }).done();
  });

  // test the index property
  it('should use index property', function(done) {
    mapper.baz(123).then(function(result) {
      assert(result.length > 0, 'Should find a result');
      done();
    }).done();
  });

  // test the index property
  it('should raise an unique error', function(done) {
    var fooUnique = mapper.create({
      foo: 'hello', bar: 'john', baz: 007
    });
    var multiUnique = mapper.create({
      foo: 'superman', bar: 'world', baz: 123
    });
    // test errors
    fooUnique.save().then(function() {
      assert(false, 'Should fail, unique constraint');
    }, function() {
      multiUnique.save().then(function() {
        assert(false, 'Should fail, unique constraint');
      }, function() {
        done();
      }).done();
    }).done();
  });

});