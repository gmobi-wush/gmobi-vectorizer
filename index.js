const
  _ = require("underscore"),
  vectorizer = require("./vectorizer"),
  transformer = require('./transformer');

exports.vectorize = function(obj, hash) {
  if (hash) {
    return vectorizer.vectorize(obj, "", {i : [], x : []}, vectorizer.pmurhash32);
  } else {
    return vectorizer.vectorize(obj, "", {i : [], x : []}, function(x) {return x;});
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
