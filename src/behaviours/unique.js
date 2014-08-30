module.exports = function(mapper, property, name) {
  if (property.unique) {
    mapper.options.views[name] = {
      type: 'unique', fields: [name]
    };
  }
  return property;
};