const
  vectorizer = require('../'),
  _ = require('underscore'),
  compatibility = require('./compatibility.js');

compatibility.testAndEval(
  function() {
    var schemas = require(__dirname + '/schema/bid.online.json');
    var transformers = _.map(schemas, function(schema) {
      var transformer = new vectorizer.Transformer();
      transformer.initialize(schema);
      return transformer;
    });
    return {
      transformers : transformers
    };
  },
  function(prepareObj, indexOfCampaign, obj, isHash) {
    if (indexOfCampaign === 0) {
      prepareObj.interceptTime = 0;
      var start = new Date();
      prepareObj.interceptObj = prepareObj.transformers[0].transform(obj);
      prepareObj.interceptResult = vectorizer.vectorize(prepareObj.interceptObj, isHash, function(err) { });
      prepareObj.interceptTime += new Date() - start;
      prepareObj.transformTime = 0;
      prepareObj.hashTime = 0;
    }
    var adObj = prepareObj.interceptObj;
    adObj.bids.ad = obj.bids.ad;
    var start = new Date();
    var tmp = prepareObj.transformers[1].transform(adObj);
    prepareObj.transformTime += new Date() - start;
    start = new Date();
    var adResult = vectorizer.vectorize(tmp, isHash, function(err) { });
    prepareObj.hashTime += new Date() - start;
    var result = {
      i : prepareObj.interceptResult.i.concat(adResult.i),
      x : prepareObj.interceptResult.x.concat(adResult.x)
    };
    if (indexOfCampaign === 99) {
      console.log("interceptTime: " + prepareObj.interceptTime + " transformTime: " + prepareObj.transformTime + " hashTime: " + prepareObj.hashTime);
    }
    return result;
  },
  "Use v0.2.0 Hasher",
  null
)();
