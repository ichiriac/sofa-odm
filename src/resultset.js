var q = require('q');
/**
 * Defines a resultset
 */
module.exports = function(manager, mapper) {
  // resultset constructor
  var resultset = function(view, criteria, data, misc) {
    this.criteria = criteria;
    this.length = misc.total_rows;
    this.offset = criteria.skip;
    this.limit = criteria.limit,
    this.rows = [];
    for(var i = 0; i < data.length; i++) {
      if (data[i].doc && data[i].doc.json) {
        this.rows.push(
          mapper.create(data[i].doc.json)
        );
      }
    }
  };
  // check if has another page of data
  resultset.prototype.hasNext = function() {
    return this.skip + this.rows.length < this.length - 1;
  };
  // go to the next page
  resultset.prototype.next = function() {
    this.criteria.skip += this.limit;
    if ( this.criteria.skip < this.length) {
      return mapper.find(
        this.view, this.criteria
      );
    } else {
      return false;
    }
  };
  /**
   * Go to the previous page
   */
  resultset.prototype.previous = function() {
    this.criteria.skip -= this.limit;
    if ( this.criteria.skip > -1) {
      return mapper.find(
        this.view, this.criteria
      );
    } else {
      return false;
    }
  };
  /**
   * Go to the specified offset
   */
  resultset.prototype.go = function(offset) {
    this.criteria.skip = offset;
    if ( this.criteria.skip > -1 && this.criteria.skip < this.length) {
      return mapper.find(
        this.view, this.criteria
      );
    } else {
      return false;
    }
  };
  // manager
  return {
    deserialize: function(view, criteria, data, misc) {
      return new resultset(view, criteria, data, misc);
    }
  };
};