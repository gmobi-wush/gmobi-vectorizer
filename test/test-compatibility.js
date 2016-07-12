const
  vectorizer = require('../'),
  compatibility = require('./compatibility.js');

compatibility.testAndEval(
  function() {
    var schema = require(__dirname + '/schema/bid.json');
    var transformer = new vectorizer.Transformer();
    transformer.initialize(schema);
    return {
      transformer : transformer
    };
  },
  function(prepareObj, indexOfCampaign, obj, isHash) {
    var features = prepareObj.transformer.transform(obj);
    return vectorizer.vectorize(features, isHash, function(err) { });
  },
  "Use v0.1.5 Hasher",
  null
)();
