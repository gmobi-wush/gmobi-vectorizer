const 
  _ = require('underscore');

function validateProperty(obj, property) {
  if (!_.has(obj, property)) throw new Error("The object does not has property: " + property);
}

// Constructor
function Transformer(schemas) {
  // initialization
  this.transformersList = [];
}

// class methods
Transformer.prototype.push = function(transformer) {
  this.transformersList.push(transformer);
};

Transformer.prototype.initialize = function(schemas) {
  // validate schemas
  if (!_.isArray(schemas)) new Error("schema should be an array of objects");
  _.forEach(schemas, function(schema) {
    validateProperty(schema, "required");
  });

  var $ = this;
  // generating trnasformer from schema
  _.forEach(schemas, function(schema) {
    _.forEach(schema.required, function(property) {
      Transformer.factories;
      $.transformersList.push(Transformer.factories.required(property));
    });
  });
};

Transformer.prototype.transform = function(obj) {
  _.forEach(this.transformersList, function(transformer) {
    transformer.transform(obj);
  });
  return obj;
};

Transformer.factories = {};

Transformer.factories.required = function(property) {
  var propertyPath = property.split("\u0002");
  return ({
    transform : function(obj) {
      var currentObj = obj;
      _.forEach(propertyPath, function(p) {
        validateProperty(currentObj, p);
        currentObj = currentObj[p];
      });
      return obj;
    }
  });
};

// export the class
exports.Transformer = Transformer;