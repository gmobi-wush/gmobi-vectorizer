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

function hash(obj, prefix, retval) {
  _.forEach(Object.keys(obj), function(key) {
    if (check.object(obj[key])) {
      hash(obj[key], prefix + key + keyValueSeperator, retval);
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

exports.hash = function(obj) {
  return hash(obj, "", {i : [], x : []});
}
