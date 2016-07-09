const
  keyValueSeperator = '\1',
  _ = require("underscore"),
  // mm3 = require("murmurhash3"),
  check = require('check-types'),
  seed = 20160419,
  size = 4194304;

var cmodule;
try {
  cmodule = require(__dirname + '/build/Release/cmodule');
} catch(e) {
  console.log(e.message);
  cmodule = require(__dirname + '/build/default/cmodule');
}

function pmurhash32(s) {
  return cmodule.pmurhash32(s);
}

function vectorize(obj, prefix, retval, operator, errHandler) {
  if (typeof errHandler === "undefined") {
    errHandler = function(x) {
      throw new Error(x);
    };
  }
  if (check.string(obj)) {
    retval.i.push(operator(obj));
    retval.x.push(1.0);
    return retval;
  }
  if (check.array.of.string(obj)) {
    _.forEach(obj, function(key) {
      retval.i.push(operator(key));
      retval.x.push(1.0);
    });
    return retval;
  }
  if (check.array.of.object(obj)) {
    if (obj.length > 1) throw new Error("Array of Object should only has length 1 or 0(skipped)");
    if (obj.length == 1) {
      vectorize(obj[0], prefix, retval, operator, errHandler);
    }
    return retval;
  }
  _.forEach(Object.keys(obj), function(key) {
    if (check.object(obj[key])) {
      vectorize(obj[key], prefix + key + keyValueSeperator, retval, operator, errHandler);
    } else if (check.string(obj[key])) {
      retval.i.push(operator(prefix + key + keyValueSeperator + obj[key]));
      retval.x.push(1.0);
    } else if (check.number(obj[key])) {
      retval.i.push(operator(prefix + key));
      retval.x.push(obj[key]);
    } else if (check.array.of.string(obj[key])) {
      _.map(obj[key], function(s) {
        retval.i.push(operator(prefix + key + keyValueSeperator + s));
        retval.x.push(1.0);
      });
    } else if (check.array.of.number(obj[key])) {
      _.map(obj[key], function(s) {
        if (!check.integer(s)) {
          errHandler("Numeric Array is not supported!");
        }
        retval.i.push(operator(prefix + key + keyValueSeperator + s));
        retval.x.push(1.0);
      });
    } else if (check.array.of.object(obj[key])) {
      if (obj[key].length > 1) throw new Error("Array of Object should only has length 1 or 0(skipped)");
      if (obj[key].length == 1) {
        vectorize(obj[key][0], prefix + key + keyValueSeperator, retval, operator, errHandler);
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
        errHandler("Unsupported Array type: " + _.map(obj[key], function(x) {
          return Object.prototype.toString.call(x);
        }).join(","));
      } else {
        errHandler("Unsupported type: " + Object.prototype.toString.call(obj[key]));
      }
    }
  });
  return retval;
}

exports.pmurhash32 = pmurhash32;

exports.vectorize = vectorize;

exports.keyValueSeperator = keyValueSeperator;
