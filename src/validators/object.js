module.exports = function(manager) {
  return function(property) {
    // type validator
    var checkType = property.checkType;
    property.checkType = function(value) {
      // @fixme arrays are not objects
      return typeof value === 'object' && checkType(value);
    };
  };
};