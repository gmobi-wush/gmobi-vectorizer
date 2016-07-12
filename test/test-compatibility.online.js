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


// const
//   _ = require('underscore'),
//   fs = require('fs'),
//   path = require('path'),
//   zlib = require('zlib'),
//   es = require('event-stream'),
//   assert = require('assert'),
//   vectorizer = require('../'),
//   check = require('check-types'),
//   crypto = require('crypto');
//
// function getMD5(path, cb) {
//   var hash = crypto.createHash('md5');
//   hash.setEncoding('hex');
//   return fs.createReadStream(path)
//     .pipe(hash)
//     .on('finish', function() {
//       hash.end();
//       return cb(null, hash.read());
//     });
// }
//
// describe("Test that the module creates the same object as the one online", function() {
//   it("Test the test/ndjson/bid.ndjson.gz without hash", function(done) {
//     var schemas = require(__dirname + '/schema/bid.online.json');
//     var transformers = _.map(schemas, function(schema) {
//       var transformer = new vectorizer.Transformer();
//       transformer.initialize(schema);
//       return transformer;
//     });
//     return fs.createReadStream("test/ndjson/bid.ndjson.gz").pipe(zlib.createGunzip())
//       .pipe(es.split())
//       .pipe(es.map(function(line, cb) {
//         var obj;
//         try {
//           obj = {
//             bids : JSON.parse(line)
//           };
//         } catch(ex) {
//           return cb(null, "");
//         }
//         var interceptObj = transformers[0].transform(obj);
//         var interceptResult = vectorizer.vectorize(interceptObj, false, function(err) { });
//         var retval = [];
//         for(var j = 0;j < 100;j++) {
//           var adObj = interceptObj;
//           adObj.bids.ad = {
//             id : "56fce4c2ac79e5824c45608e" + j,
//             cid : "56fce40aac79e5824c456086" + j
//           };
//           adObj = transformers[1].transform(adObj)
//           var adResult = vectorizer.vectorize(adObj, false, function(err) { });
//           var result = {
//             i : interceptResult.i.concat(adResult.i),
//             x : interceptResult.x.concat(adResult.x)
//           };
//           var index = [];
//           for(i = 0;i < result.i.length;i++) {
//             index.push(i);
//           }
//           index = _.sortBy(index, function(i) {return result.i[i];});
//           retval.push(JSON.stringify({
//             i: _.map(index, function(i) {return result.i[i];}),
//             x: _.map(index, function(i) {return result.x[i];})
//           }));
//         }
//         return cb(null, retval.join("\n") + "\n");
//       }))
//       .pipe(fs.createWriteStream("bid.vectorized.online.ndjson"))
//       .on('finish', function() {
//         return getMD5("bid.vectorized.online.ndjson", function(err, result) {
//           if (err) throw err;
//           assert(result === "2e41f578c5fe3b2e45f05344fcd11081");
//           return done();
//         });
//       });
//   });
//
//   it("Test the test/ndjson/bid.ndjson.gz with hash", function(done) {
//     var schemas = require(__dirname + '/schema/bid.online.json');
//     var transformers = _.map(schemas, function(schema) {
//       var transformer = new vectorizer.Transformer();
//       transformer.initialize(schema);
//       return transformer;
//     });
//     return fs.createReadStream("test/ndjson/bid.ndjson.gz").pipe(zlib.createGunzip())
//       .pipe(es.split())
//       .pipe(es.map(function(line, cb) {
//         var obj;
//         try {
//           obj = {
//             bids : JSON.parse(line)
//           };
//         } catch(ex) {
//           return cb(null, "");
//         }
//         var interceptObj = transformers[0].transform(obj);
//         var interceptResult = vectorizer.vectorize(interceptObj, true, function(err) { });
//         var retval = [];
//         for(var j = 0;j < 100;j++) {
//           var adObj = interceptObj;
//           adObj.bids.ad = {
//             id : "56fce4c2ac79e5824c45608e" + j,
//             cid : "56fce40aac79e5824c456086" + j
//           };
//           adObj = transformers[1].transform(adObj)
//           var adResult = vectorizer.vectorize(adObj, true, function(err) { });
//           var result = {
//             i : interceptResult.i.concat(adResult.i),
//             x : interceptResult.x.concat(adResult.x)
//           };
//           var index = [];
//           for(i = 0;i < result.i.length;i++) {
//             index.push(i);
//           }
//           index = _.sortBy(index, function(i) {return result.i[i];});
//           retval.push(JSON.stringify({
//             i: _.map(index, function(i) {return result.i[i];}),
//             x: _.map(index, function(i) {return result.x[i];})
//           }));
//         }
//         return cb(null, retval.join("\n") + "\n");
//       }))
//       .pipe(fs.createWriteStream("bid.vectorized.online.hashed.ndjson"))
//       .on('finish', function() {
//         return getMD5("bid.vectorized.online.hashed.ndjson", function(err, result) {
//           if (err) throw err;
//           assert(result === "46e919d196d93ae76b51c441a9784b19");
//           return done();
//         });
//       });
//   });
//
// });
