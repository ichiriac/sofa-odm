var assert = require('assert');

describe('test behaviours', function() {

  var session;

  it('should connect to couchbase', function(done) {
    require('./connector')().then(function(api) {
      session = api;
      done();
    }).done();
  });

  it('should declare each type', function() {
    session.declare('items', {
      properties: {
        a: 'string',
        b: 'number',
        c: 'object',
        d: 'array',
        e: 'date',
        f: 'boolean'
      }
    });
  });

  it('should test string', function(done) {
    var stringTest = session.declare('stringTest', {
      properties: {
        sizeMax: {
          type: 'string',
          validate: 8 // max len 8 chars
        },
        sizeMinMax: {
          type: 'string',
          validate: [6, 12] // min len 6, max len 12
        },
        regex: {
          type: 'string',
          validate: /test/i // must contains test
        },
        email: {
          type: 'string',
          validate: '^[a-z]+@[a-z]+\\.[a-z]{2,3}$' // converts a string as an regexp
        },
        secret: {
          type: 'string',
          validate: function(value) {
            return value && value.substring(0, 1) == 's';
          }
        }
      }
    });
    // this record should pass
    var ok = stringTest.create({
      sizeMax: null,
      sizeMinMax: 'azerty',
      regex: "This is a cool TeSt content !",
      email: 'john@doe.com',
      secret: 'sofa'
    });
    ok.save().then(function() {
      done();
    }, function(err)  {
      assert(false, 'Should not fail : ' + err);
    }).done();
    
    
  });

});