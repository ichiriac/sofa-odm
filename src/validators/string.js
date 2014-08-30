// string fields
module.exports = function(manager) {
  return function(property) {
    // type validator
    var checkType = property.checkType;
    property.checkType = function(value) {
      return typeof value === 'string' && checkType(value);
    };

    // contents validator
    if (property.hasOwnProperty('validate')) {
      var checkContents = property.checkContents;
      var valType = typeof(property.validate);
      if (valType === 'number') {
        property.validate = [0, property.validate];
      } else if (valType === 'string') {
        property.validate = new RegExp(property.validate);
      }
      if (property.validate instanceof Array) {
        property.checkContents = function(value) {
          if (property.validate.length == 1) {
            if (value.length > property.validate[0]) {
              throw new Error('"' + property.name + '" size exceeds ' + property.validate[0] + ' limit');
            }
          } else {
            if (value && value.length > property.validate[1]) {
              throw new Error('"' + property.name + '" size exceeds ' + property.validate[1] + ' limit');
            }
            if (property.validate[0] > 0 && (!value || value.length < property.validate[0])) {
              throw new Error('"' + property.name + '" must contain at least ' + property.validate[0] + ' chars');
            }
          }
          return checkContents(value);
        };
      } else if (property.validate instanceof RegExp) {
        property.checkContents = function(value) {
          if (!property.validate.test(value)) {
            throw new Error('Bad format for "' + property.name + '", does not match with ' + property.validate);
          }
          return checkContents(value);
        };
      } else if (property.validate instanceof Function) {
        property.checkContents = function(value) {
          if (!property.validate.apply(property, [value])) {
            throw new Error('Bad format for "' + property.name + '"');
          }
          return checkContents(value);
        };
      } else {
        throw new Error('Bad validator format for "' + property.name + '"');
      }
    }
  };
};