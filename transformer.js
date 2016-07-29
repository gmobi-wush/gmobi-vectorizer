const
  _ = require('underscore'),
  check = require('check-types'),
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

  var $ = this;
  // generating transformations from schema
  _.forEach(schemas, function(schema) {
    if (!!schema.require) _.forEach(schema.require, function(property) {
      $.transformersList.push(Transformer.factories.require(property));
    });
    if (!!schema.include) {
      if (schema.include.length > 0) {
        $.transformersList.push(Transformer.factories.include(schema.include));
      }
    }
    if (!!schema.exclude) {
      if (schema.exclude.length > 0) {
        $.transformersList.push(Transformer.factories.exclude(schema.exclude));
      }
    }
    if (!!schema.binning) {
      if (schema.binning.length > 0) {
        $.transformersList.push(Transformer.factories.binning(schema.binning));
      }
    }
    if (!!schema.split) {
      if (schema.split.length > 0) {
        $.transformersList.push(Transformer.factories.split(schema.split));
      }
    }
		if (!!schema.removeInteraction) {
			$.transformersList.push(Transformer.factories.removeInteraction());
		}
    if (!!schema.interaction) _.forEach(schema.interaction, function(properties) {
      if (properties.length != 2) {
        throw Error("Invalid properties of interaction");
      }
      $.transformersList.push(Transformer.factories.interaction(properties[0], properties[1]));
    });
  });
};

Transformer.prototype.transform = function(src) {
  var obj = JSON.parse(JSON.stringify(src));
  _.forEach(this.transformersList, function(transformer) {
    obj = transformer.transform(obj);
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
        _.forEach(_.head(property, -1), function(p) {
          currentObj = currentObj[p];
          currentRetval = currentRetval[p];
        });
        var last_key = _.tail(property, -1);
        if (_.has(currentObj, last_key)) {
          if (check.object(currentObj[last_key])) {
            _.extend(currentRetval[last_key], currentObj[last_key]);
          } else {
            currentRetval[last_key] = currentObj[last_key];
          }
        }
      });
      return retval;
    }
  });
};

Transformer.factories.exclude = function(properties) {
  var propertiesPath = _.map(properties, function(property) {
    return property.split("\u0002");
  });
  return {
    transform: function(obj) {
      _.forEach(propertiesPath, function(property) {
        var currentObj = obj;
        _.forEach(_.head(property, -1), function(p) {
          currentObj = currentObj[p];
        });
        var last_key = _.tail(property, -1);
        if (_.has(currentObj, last_key)) {
          delete currentObj[last_key];
        }
      });
      return obj;
    }
  };
}

var Binner = {
  breaks : function(breaks, x) {
    var retval;
    for(var i = 0;i < breaks.length;i++) {
      if (x < breaks[i]) {
        retval = i;
        return retval.toString();
      }
    }
    retval = breaks.length;
    return retval.toString();
  },
  modulo : function(modulo, x) {
    var retval = x % modulo;
    return retval.toString();
  },
  division : function(den, x) {
    var retval = Math.floor(x / den);
    return retval.toString();
  }
};

Transformer.factories.binning = function(properties) {
  var propertiesObj = _.map(properties, function(property) {
    return {
      path: property.path.split("\u0002"),
      type: property.type,
      args: property.args
    };
  });
  return ({
    transform : function(obj) {
      _.forEach(propertiesObj, function(property) {
        var currentObj = obj, is_valid = true;
        _.forEach(_.head(property.path, -1), function(key) {
          if (!is_valid) return;
          if (!_.has(currentObj, key)) {
            is_valid = false;
          }
          currentObj = currentObj[key];
        });
        if (is_valid) {
          var last_key = _.tail(property.path, -1);
          if (!_.has(currentObj, last_key)) return;
          if (!check.number(currentObj[last_key])) throw new Error("Binning a non-numeric field");
          currentObj[last_key] = Binner[property.type](property.args, currentObj[last_key]);
        }
      });
      return obj;
    }
  });
};

Transformer.factories.split = function(properties) {
  var propertiesObj = _.map(properties, function(property) {
    return {
      path : property.path.split("\u0002"),
      delim : property.delim
    };
  });
  return({
    transform : function(obj) {
      _.forEach(propertiesObj, function(property) {
        var currentObj = obj, is_valid = true;
        _.forEach(_.head(property.path, -1), function(key) {
          if (!is_valid) return;
          if (!_.has(currentObj, key)) {
            is_valid = false;
          }
          currentObj = currentObj[key];
        });
        if (is_valid) {
          var last_key = _.tail(property.path, -1);
          if (!_.has(currentObj, last_key)) return;
          if (!check.string(currentObj[last_key])) throw new Error("Splitting a non-string field");
          currentObj[last_key] = _.filter(currentObj[last_key].split(property.delim), function(x) {
            return x.length > 0;
          });
        }
      });
      return obj;
    }
  });
}

var keyValueSeperatorRegex = new RegExp(vectorizer.keyValueSeperator, "i");
Transformer.factories.removeInteraction = function() {
	return({
		transform : function(obj) {
			var keys = _.filter(_.keys(obj), function(key) {
				return !keyValueSeperatorRegex.test(key);
			});
			return _.pick(obj, keys);
		}
	});
}

function typeCorrector(obj) {
  if (check.object(obj)) {
    return obj
  } else if (check.string(obj)) {
    return obj;
  } else if (check.array.of.string(obj)) {
    return obj;
  } else if (check.array.of.object(obj)) {
    return obj;
  } else {
    throw new Error("TODO");
  }
}

var interactionSeperator = "\u0003";
Transformer.factories.interaction = function(property1, property2) {
  var property1Path = property1.split("\u0002");
  var property1PathKey = property1Path.join(vectorizer.keyValueSeperator);
  var property2Path = property2.split("\u0002");
  var property2PathKey = property2Path.join(vectorizer.keyValueSeperator);
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
        vobj1 = vectorizer.vectorize(typeCorrector(obj1), "", {i : [], x : []}, function(x) {return x;}),
        vobj2 = vectorizer.vectorize(typeCorrector(obj2), "", {i : [], x : []}, function(x) {return x;});
      var retval = {};
      for(var i1 = 0;i1 < vobj1.i.length;i1++) {
        var key1 = property1PathKey + vectorizer.keyValueSeperator + vobj1.i[i1] +
          interactionSeperator + property2PathKey + vectorizer.keyValueSeperator;
        for(var i2 = 0;i2 < vobj2.i.length;i2++) {
          var key = key1 + vobj2.i[i2];
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
