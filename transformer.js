const 
  check = require('check-types');

function Transformer() {
  return this;
}

Transformer.prototype = {
  run : function(obj) {
    if (check.object(obj)) {
      return obj;
    } else {
      throw new Error("obj is not an object");
    }
  }
};

exports.Transformer = Transformer;