// handles required flag
module.exports = function(mapper, property, name) {
  if (property.required) {
    var validator = property.checkContents;
    property.checkContents = function(value) {
      if (typeof value === 'undefined') {
        throw new Error('"' + name + '" property is required');
      }
      return validator(value);
    };
  }
  return property;
};