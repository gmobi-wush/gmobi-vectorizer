const 
  keyValueSeperator = '\1',
  _ = require("underscore"),
  mm3 = require("murmurhash3"),
  check = require('check-types'),
  transformer = require('./transformer'),
  seed = 20160419,
  size = 4194304;

function pmurhash32(s) {
  return mm3.murmur32Sync(s, seed) % size;
}

function vectorize(obj, prefix, retval, operator) {
  _.forEach(Object.keys(obj), function(key) {
    if (check.object(obj[key])) {
      vectorize(obj[key], prefix + key + keyValueSeperator, retval, operator);
    } else if (check.string(obj[key])) {
      retval.i.push(operator(prefix + key + keyValueSeperator + obj[key]));
      retval.x.push(1.0);
    } else if (check.number(obj[key])) {
      retval.i.push(operator(prefix + key));
      retval.x.push(obj[key]);
    } else if (check.array.of.string(obj[key])) {
      _.map(obj[key], function(s) {
        retval.i.push(operator(prefix + key + keyValueSeperator + s))
        retval.x.push(1.0);
      });
    } else if (check.array.of.number(obj[key])) {
      _.map(obj[key], function(s) {
        if (!check.integer(s)) {
          throw new Error("Numeric Array is not supported!");
        }
        retval.i.push(operator(prefix + key + keyValueSeperator + s));
        retval.x.push(1.0);
      });
    } else if (check.array.of.object(obj[key])) {
      if (obj[key].length > 1) throw new Error("Array of Object should only has length 1 or 0(skipped)");
      if (obj[key].length == 1) {
        vectorize(obj[key][0], prefix + key + keyValueSeperator, retval, operator);
      }
    } else if (check.boolean(obj[key])) {
      if (obj[key]) {
        retval.i.push(operator(prefix + key + keyValueSeperator + "TRUE"));
      } else {
        retval.i.push(operator(prefix + key + keyValueSeperator + "FALSE"));
      }
      retval.x.push(1.0);
    } else {
      if (check.array(obj[key])) {
        throw new Error("Unsupported Array type: " + _.map(obj[key], function(x) {
          return Object.prototype.toString.call(x);
        }).join(","));
      } else {
        throw new Error("Unsupported type: " + Object.prototype.toString.call(obj[key]));
      }
    }
  });
  return retval;
}

exports.vectorize = function(obj, hash) {
  if (hash) {
    return vectorize(obj, "", {i : [], x : []}, pmurhash32);
  } else {
    return vectorize(obj, "", {i : [], x : []}, function(x) {return x;});
  }
};

exports.vectorize_sort = function(obj, hash) {
  var result = exports.vectorize(obj, hash);
  var index = [];
  for(i = 0;i < result.i.length;i++) {
    index.push(i);
  }
  index = _.sortBy(index, function(i) {return result.i[i];});
  return ({
    i: _.map(index, function(i) {return result.i[i];}),
    x: _.map(index, function(i) {return result.x[i];})
  });
};

exports.Transformer = transformer.Transformer;
