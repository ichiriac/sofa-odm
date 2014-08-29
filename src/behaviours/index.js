module.exports = function(field, mapper, name) {
  if (field.meta.unique) {
    mapper.options.views[name] = {
      type: 'index', fields: [name]
    };
  }
  return field;
};