const 
  _ = require('underscore'),
  vectorizer = require('./vectorizer');

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
    validateProperty(schema, "require");
    validateProperty(schema, "include");
    validateProperty(schema, "interaction");
  });

  var $ = this;
  // generating trnasformer from schema
  _.forEach(schemas, function(schema) {
    _.forEach(schema.require, function(property) {
      $.transformersList.push(Transformer.factories.require(property));
    });
    $.transformersList.push(Transformer.factories.include(schema.include));
    _.forEach(schema.interaction, function(properties) {
      if (properties.length != 2) {
        throw Error("Invalid properties of interaction");
      }
      $.transformersList.push(Transformer.factories.interaction(properties[0], properties[1]));
    });
  });
};

Transformer.prototype.transform = function(src) {
  var obj = _.clone(src);
  _.forEach(this.transformersList, function(transformer) {
    transformer.transform(obj);
  });
  return obj;
};

Transformer.factories = {};

Transformer.factories.require = function(property) {
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

Transformer.factories.include = function(properties) {
  var propertiesPath = _.map(properties, function(property) {
    return property.split("\u0002");
  });
  var createNestedObject = function( base, names ) {
    for( var i = 0; i < names.length; i++ ) {
        base = base[ names[i] ] = base[ names[i] ] || {};
    }
  };
  return ({
    transform: function(obj) {
      retval = {};
      _.forEach(propertiesPath, function(property) {
        createNestedObject(retval, property);
        var currentObj = obj, currentRetval = retval;
        _.forEach(property, function(p) {
          currentObj = currentObj[p];
          currentRetval = currentRetval[p];
        });
        _.extend(currentRetval, currentObj);
      });
      return retval;
    }
  });
};

var interactionSeperator = "\u0002";
Transformer.factories.interaction = function(property1, property2) {
  var property1Path = property1.split("\u0002");
  var property2Path = property2.split("\u0002");
  return({
    transform: function(obj) {
      var obj1 = obj, obj2 = obj;
      _.forEach(property1Path, function(p) {
        validateProperty(obj1, p);
        obj1 = obj1[p];
      });
      _.forEach(property2Path, function(p) {
        validateProperty(obj2, p);
        obj2 = obj2[p];
      });
      var 
        vobj1 = vectorizer.vectorize(obj1, "", {i : [], x : []}, function(x) {return x;}),
        vobj2 = vectorizer.vectorize(obj2, "", {i : [], x : []}, function(x) {return x;});
      var retval = {};
      for(var i1 = 0;i1 < vobj1.i.length;i1++) {
        for(var i2 = 0;i2 < vobj2.i.length;i2++) {
          var key = property1Path + vectorizer.keyValueSeperator + vobj1.i[i1] + 
            interactionSeperator + property2Path + vectorizer.keyValueSeperator + vobj2.i[i2];
          var value = vobj1.x[i1] * vobj2.x[i2];
          retval[key] = value;
        }
      }
      return _.extend(obj, retval);
    }
  });
};

// export the class
exports.Transformer = Transformer;