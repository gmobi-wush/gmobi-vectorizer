const 
  keyValueSeperator = '\1',
  _ = require("underscore"),
  mm3 = require("murmurhash3"),
  check = require('check-types'),
  seed = 20160419,
  size = 4194304;

function pmurhash32(s) {
  return mm3.murmur32Sync(s, seed) % size;
}

function vectorize(obj, prefix, retval) {
  _.forEach(Object.keys(obj), function(key) {
    if (check.object(obj[key])) {
      vectorize(obj[key], prefix + key + keyValueSeperator, retval);
    } else if (check.array.of.string(obj[key])) {
      _.map(obj[key], function(s) {
        retval.i.push(prefix + key + keyValueSeperator + s);
        retval.x.push(1.0);
      });
    } else if (check.string(obj[key])) {
      retval.i.push(prefix + key + keyValueSeperator + obj[key]);
      retval.x.push(1.0);
    } else if (check.number(obj[key])) {
      retval.i.push(prefix + key);
      retval.x.push(obj[key]);
    }
  });
  return retval;
}

function vectorize_hash(obj, prefix, retval) {
  _.forEach(Object.keys(obj), function(key) {
    if (check.object(obj[key])) {
      vectorize_hash(obj[key], prefix + key + keyValueSeperator, retval);
    } else if (check.array.of.string(obj[key])) {
      _.map(obj[key], function(s) {
        retval.i.push(pmurhash32(prefix + key + keyValueSeperator + s));
        retval.x.push(1.0);
      });
    } else if (check.string(obj[key])) {
      retval.i.push(pmurhash32(prefix + key + keyValueSeperator + obj[key]));
      retval.x.push(1.0);
    } else if (check.number(obj[key])) {
      retval.i.push(pmurhash32(prefix + key));
      retval.x.push(obj[key]);
    }
  });
  return retval;
}


exports.vectorize = function(obj, hash) {
  if (hash) {
    return vectorize_hash(obj, "", {i : [], x : []});
  } else {
    return vectorize(obj, "", {i : [], x : []});
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
