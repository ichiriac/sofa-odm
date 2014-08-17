module.exports = function(name, options) {
  return {
    validate: {
      type: function(value) {
        return value instanceof Array;
      }
    }
  };
};