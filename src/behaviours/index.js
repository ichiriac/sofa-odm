module.exports = function(mapper, property, name) {
  if (property.index) {
    mapper.options.views[name] = {
      type: 'index', properties: [name]
    };
  }
  return property;
};