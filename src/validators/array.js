module.exports = function(manager) {
  return function(property) {
    // type validator
    var checkType = property.checkType;
    property.checkType = function(value) {
      return value instanceof Array && checkType(value);
    };
  };
};