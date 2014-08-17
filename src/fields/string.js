// string fields
module.exports = function(name, options) {
  // type validator
  var handler = {
    validate: {
      type: function(value) {
        return typeof value === 'string';
      }
    }
  };
  // contents validator
  if (options.hasOwnProperty('validate')) {
    if (options.validate instanceof Array) {
      handler.validate.contents = function(value) {
        if (options.validate.length == 1) {
          if (value.length > options.validate[0]) {
            throw new Error('"' + name + '" size exceeds ' + options.validate[0] + ' limit');
          }
        } else {
          if (value.length > options.validate[1]) {
            throw new Error('"' + name + '" size exceeds ' + options.validate[1] + ' limit');
          }
          if (value.length < options.validate[0]) {
            throw new Error('"' + name + '" must contain at least ' + options.validate[0] + ' chars');
          }
        }
        return true;
      };
    } else if (options.validate instanceof RegExp) {
      handler.validate.contents = function(value) {
        if (!options.validate.test(value)) {
          throw new Error('Bad format for "' + name + '"');
          break;
        }
        return true;
      };
    }
  }
  return handler
};