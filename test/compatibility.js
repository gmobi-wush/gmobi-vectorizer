const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  assert = require('assert'),
  check = require('check-types'),
  crypto = require('crypto'),
  async = require('async');

function getMD5(path, cb) {
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');
  return fs.createReadStream(path)
    .pipe(hash)
    .on('finish', function() {
      hash.end();
      return cb(null, hash.read());
    });
}

/**
 * [testAndEval description]
 * @param  {[function]} prepare return preparedObj
 * @param  {[function]} operation function(preparedObj, indexOfCampaign, toHashObj, isHash) return hashed object
 * @param  {[type]} describeName [description]
 * @param  {[type]} itName       [description]
 * @return {[type]}              [description]
 */
function testAndEval(prepare, operation, describeName, itName) {
  var srcs = ["test/ndjson/bid.ndjson.gz"];
  return function() {
    var preparedObj = prepare();
    var getTasks = function(isHash) {
      return _.map(srcs, function(src) {
        var dst = src.replace("test/ndjson/", "") + ".result";
        return function(asyncCB) {
          var totalTime = 0, count = 0;
          var s = fs.createReadStream(src);
          if (src.match(/\.gz$/)) {
            s = s.pipe(zlib.createGunzip());
          }
          s = s.pipe(es.split())
            .pipe(es.map(function(line, esmapCB) {
              var obj;
              try {
                obj = {
                  bids : JSON.parse(line)
                }
              } catch(ex) {
                return esmapCB(null, "");
              }
              var retval = [];
              for(var j = 0;j < 100;j++) {
                obj.bids.ad = {
                  id : "56fce4c2ac79e5824c45608e" + j,
                  cid : "56fce40aac79e5824c456086" + j
                };
                var start = new Date();
                var result = operation(preparedObj, j, obj, isHash);
                totalTime += new Date() - start;
                count += 1;
                var index = [];
                for(i = 0;i < result.i.length;i++) {
                  index.push(i);
                }
                index = _.sortBy(index, function(i) {return result.i[i];});
                retval.push(JSON.stringify({
                  i: _.map(index, function(i) {return result.i[i];}),
                  x: _.map(index, function(i) {return result.x[i];})
                }));
              } // for j
              delete obj.bids.ad;
              assert(_.isEqual(obj.bids, JSON.parse(line)));
              return esmapCB(null, retval.join("\n") + "\n");
            })) // pipe(es.map(...))
            .pipe(fs.createWriteStream(dst))
            .on('finish', function() {
              return getMD5(dst, function(err, result) {
                if (err) return asyncCB(err, null);
                try {
                  if (isHash) {
                    assert(result === "46e919d196d93ae76b51c441a9784b19");
                  } else {
                    assert(result === "2e41f578c5fe3b2e45f05344fcd11081");
                  }
                } catch (ex) {
                  return asyncCB(ex, {totalTime : totalTime, count : count});
                }
              }); // getMD5
            }); // on finish
        };
      }); // tasks
    }
    return describe(describeName || "testAndEval", function() {
      it(itName || ("test " + srcs.join(",") + " without Hash"), function(done) {
        return async.series(getTasks(false), function(err, results) {
          if (results) {
            var totalTime = _.chain(results)
              .map(function(x) {return x.totalTime;})
              .reduce(function(a, b) {return a + b;})
              .value();
            var count = _.chain(results)
              .map(function(x) {return x.count;})
              .reduce(function(a, b) {return a + b;})
              .value();
            console.log("totalTime: " + totalTime + " ms, avgTime: " + totalTime / count + " ms");
          }
          if (err) throw err;
          return done();
        });
      });
      it(itName || ("test " + srcs.join(",") + " with Hash"), function(done) {
        return async.series(getTasks(true), function(err, results) {
          if (results) {
            var totalTime = _.chain(results)
              .map(function(x) {return x.totalTime;})
              .reduce(function(a, b) {return a + b;})
              .value();
            var count = _.chain(results)
              .map(function(x) {return x.count;})
              .reduce(function(a, b) {return a + b;})
              .value();
              console.log("totalTime: " + totalTime + " ms, avgTime: " + totalTime / count + " ms");
          }
          if (err) throw err;
          return done();
        });
      });
    });
  };
}

module.exports = {
  testAndEval : testAndEval
}
// describe("Test that the module creates the same object as the one online", function() {
//   it("Test the test/ndjson/bid.ndjson.gz without hash", function(done) {
//     var schema = require(__dirname + '/schema/bid.json');
//     var transformer = new vectorizer.Transformer();
//     transformer.initialize(schema);
//     var totalTime = 0;
//     var count = 0;
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
//         var retval = [];
//         for(var j = 0;j < 100;j++) {
//           var d = new Date();
//           obj.bids.ad = {
//             id : "56fce4c2ac79e5824c45608e" + j,
//             cid : "56fce40aac79e5824c456086" + j
//           };
//           var features = transformer.transform(obj);
//           var result = vectorizer.vectorize(features, false, function(err) { });
//           totalTime += new Date() - d;
//           count += 1;
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
//       .pipe(fs.createWriteStream("bid.vectorized.ndjson"))
//       .on('finish', function() {
//         return getMD5("bid.vectorized.ndjson", function(err, result) {
//           if (err) throw err;
//           assert(result === "2e41f578c5fe3b2e45f05344fcd11081");
//           console.log("totalTime: " + totalTime + " ms, avgTime: " + totalTime / count + " ms");
//           return done();
//         });
//       });
//   });
//
//   it("Test the test/ndjson/bid.ndjson.gz with hash", function(done) {
//     var schema = require(__dirname + '/schema/bid.json');
//     var transformer = new vectorizer.Transformer();
//     transformer.initialize(schema);
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
//         var retval = [];
//         for(var j = 0;j < 100;j++) {
//           obj.bids.ad = {
//             id : "56fce4c2ac79e5824c45608e" + j,
//             cid : "56fce40aac79e5824c456086" + j
//           };
//           var features = transformer.transform(obj);
//           var result = vectorizer.vectorize(features, true, function(err) { });
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
//       .pipe(fs.createWriteStream("bid.vectorized.hashed.ndjson"))
//       .on('finish', function() {
//         return getMD5("bid.vectorized.hashed.ndjson", function(err, result) {
//           if (err) throw err;
//           assert(result === "46e919d196d93ae76b51c441a9784b19");
//           return done();
//         });
//       });
//   });
//
// });
