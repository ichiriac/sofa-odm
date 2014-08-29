// handles required flag
module.exports = function(manager) {
  return function(mapper, field, name) {
    if (field.meta.hasOwnProperty('required') && field.meta.required === true) {
      var validator = field.validate.contents;
      field.validate.contents = function(value) {
        if (typeof value === 'undefined') {
          throw new Error('"' + name + '" property is required');
        }
        return validator(value);
      };
    }
    return field;
  };
};