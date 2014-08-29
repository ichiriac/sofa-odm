module.exports = function(manager) {
  return function(property) {
    // type validator
    var checkType = property.checkType;
    property.checkType = function(value) {
      return typeof value === 'boolean' && checkType(value);
    };
  };
};