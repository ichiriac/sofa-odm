// field manager
module.exports = function(manager, mapper) {
  // initialize a new property holder
  var property = function(options, name) {
    // shortcut
    if (typeof options == 'string') {
      options = { type: options };
    }
    // copy options
    for(var i in options) {
      this[i] = options[i];
    }
    // registers default values
    this.mapper = mapper;
    this.name = name;
    // decorate with specified type behaviour
    if (this.hasOwnProperty('type') && this.type) {
      if (!manager.options.validators.hasOwnProperty(this.type)) {
        throw new Error('Undefined type validator "' + this.type + '" for property "' + name + '"');
      }
      manager.options.validators[this.type](this);
    }
  };
  /**
   * Serialize a value before storing it in couchbase
   */
  property.prototype.serialize = function(value) {
    return value;
  };
  /**
   * Unserialize a value from a couchebase result
   */
  property.prototype.unserialize = function(value) {
    return value;
  };
  /**
   * Checks the value type
   */
  property.prototype.checkType = function(value) {
    return true;
  };
  /**
   * Checks the value contents
   */
  property.prototype.checkContents = function(value) {
    return true;
  };
  // returns the property class
  return property;
};