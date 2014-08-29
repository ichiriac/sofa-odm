module.exports = function(field, mapper, name) {
  if (field.meta.unique) {
    mapper.options.views[name] = {
      type: 'unique', fields: [name]
    };
  }
  return field;
};