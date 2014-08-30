
var assert = require('assert');
var q = require('q');

describe('test record api', function() {
  var couchbase;
  it('should connect', function(done) {
    require('./connector')().then(function(api) {
      couchbase = api;
      done();
    }).done();
  });

  var mapper;
  it('should declare', function(done) {
    mapper = couchbase.declare('test-record', {
      autoincrement: false,
      properties: {
        foo: {
          type: 'number',
          required: true,
          index: true
        },
        bar: {
          type: 'string',
          validate: [2,8]
        },
        baz: {
          type: 'string',
          validate: /[0-9]+/
        },
        num: {
          type: 'number',
          get: function() {
            return this.__buffer.num * 2;
          }
        }
      }
    });
    done();
  });

  it('should create & save', function(done) {
    var entry = mapper.create({
      foo: 123,
      bar: 'abc',
      baz: '123'
    });
    entry.num = 2;
    assert(entry.num == 4, 'Should use getter !');
    entry.save().then(function() {
      done();
    }).done();
  });

  it('should fail by type', function(done) {
    var entry = mapper.create({
      foo: false,
      bar: '',
      baz: 'azerty'
    });
    entry.save().then(function() {
      assert(false, 'Should not succeed');
    }, function(err) {
      done();
    }).done();
  });

});