
var assert = require('assert');
var q = require('q');

describe('test resultset api', function() {

  var couchbase;
  it('should connect', function(done) {
    require('./connector')().then(function(api) {
      couchbase = api;
      done();
    }).done();
  });

  var finder;
  it('should declare', function(done) {
    finder = couchbase.declare('test-finder', {
      autoincrement: false,
      properties: {
        value: {
          type: 'number',
          required: true,
          index: true
        }
      }
    });
    done();
  });

  it('should setup', function(done) {
    finder.setup().then(function() {
      done();
    }).done();
  });

  it('should cleanup previous entries', function(done) {
    finder.find('value', { startkey: 0, endkey: 50, limit: 1000}).then(function(result) {
      var records = [];
      result.each(function(item) {
        records.push(item.remove(true));
      });
      q.all(records).then(function() {
        done();
      }).done();
    }).done();
  });

  it('should create entries', function(done) {
    var records = [];
    for(var i = 1; i < 50; i++) {
      records.push(finder.create({ value: i }).save(true));
    }
    q.all(records).then(function() {
      done();
    }).done();
  });

  // start to find some data
  it('should find 10', function(done) {
    finder.find('value', 10).then(function(result) {
      for(var i = 0; i < result.rows.length; i++) {
        assert(result.rows[i].value == 10, 'value MUST be 10, found ' + result.rows[i].value);
      }
      done();
    }).done();
  });

  // start multiple values
  it('should find 10 or 20', function(done) {
    finder.find('value', [10, 20]).then(function(result) {
      for(var i = 0; i < result.rows.length; i++) {
        assert(
          result.rows[i].value == 10 
          || result.rows[i].value == 20
          , 'value MUST be 10 or 20, found ' + result.rows[i].value
        );
      }
      done();
    }).done();
  });

  // search a range of keys
  it('should find from 30 to 40', function(done) {
    finder.find('value', {
      startkey: 30, endkey: 40
    }).then(function(result) {
      for(var i = 0; i < result.rows.length; i++) {
        assert(
          result.rows[i].value > 29
          && result.rows[i].value < 41
          , 'value MUST between 30 and 40, found ' + result.rows[i].value
        );
      }
      done();
    }).done();
  });
  // test next
  it('should have next', function(done) {
    finder.find('value', { startkey: 1, endkey: 50, limit: 10}).then(function(results) {
      assert(results.hasNext(), 'Should have next');
      return results.next();
    }).then(function(results) {
      assert(results.hasNext(), 'Should have next');
      return results.go(results.length - results.limit);
    }).then(function(results) {
      assert(!results.hasNext(), 'Should NOT have next');
      done();
    }).done();
  });
  // test prev
  it('should have prev', function(done) {
    finder.find('value', { startkey: 1, endkey: 50, limit: 10}).then(function(results) {
      assert(results.hasNext(), 'Should have next');
      return results.next();
    }).then(function(results) {
      return results.previous();
    }).then(function(results) {
      assert(results.offset === 0, 'Should be at start');
      done();
    }).done();
  });
});