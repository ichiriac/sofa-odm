// field manager
module.exports = function(name, options) {
  var handler;
  // load definition from field type
  if (options.hasOwnProperty('type')) {
    handler = require('./fields/' + options.type)(name, options);
  } 
  // default handler for undefined types
  if (!handler) {
    handler = { validate: {} };
  }
  if (!handler.validate.type) {
    handler.validate.type = function(value) { return true; };
  }
  if (!handler.validate.contents) {
    handler.validate.contents = function(value) { return true; };
  }
  if (!handler.unserialize) {
    handler.unserialize = function(value) { return value; };
  }
  if (!handler.serialize) {
    handler.serialize = function(value) { return value; };
  }
  // restore options
  handler.meta = options;
  // custom validation function
  if (options.hasOwnProperty('validate') && (typeof options.validate === 'function')) {
    handler.validate.contents = options.validate;
  }
  // handles required flag
  if (options.hasOwnProperty('required') && options.required === true) {
    var validator = handler.validate.contents;
    handler.validate.contents = function(value) {
      if (typeof value === 'undefined') {
        throw new Error('"' + name + '" property is required');
      }
      return validator(value);
    };
  }
  return handler;
};