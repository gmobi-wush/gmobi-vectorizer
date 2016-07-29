const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  assert = require('assert'),
  check = require('check-types'),
  crypto = require('crypto'),
  async = require('async'),
	moment = require('moment').utc;

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

function testAndEval2(prepare1, prepare2, operation1, operation2, describeName, itName) {
  var srcs = ["test/ndjson/bid2.gz"];
	var prepareAndOperation = [
		{prepare : prepare1, operation : operation1},
		{prepare : prepare2, operation : operation2}
	];
  return function() {
		var resultHash = {};
    var getTasks = function(isHash, prepareAndOperationObj, suffix) {
			var preparedObj = prepareAndOperationObj.prepare();
      return _.map(srcs, function(src) {
        var dst = src.replace("test/ndjson/", "") + ".result" + suffix;
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
                obj = JSON.parse(line)
              } catch(ex) {
                return esmapCB(null, "");
              }
							var t = moment(new Date(obj.at));
						  obj.bids.env = {
						    weekday : t.isoWeekday().toString(),
						    hour : t.format("HH")
						  };
              var retval = [];
							var creativeId = obj.bids.ad.id;
							var campaignId = obj.bids.ad.cid;
              for(var j = 0;j < 100;j++) {
								if (j > 0) {
									obj.bids.ad.id = creativeId + j;
									obj.bids.ad.cid = campaignId + j;
								}
                var start = new Date();
                var result = prepareAndOperationObj.operation(preparedObj, j, obj, isHash);
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
							obj.bids.ad.id = creativeId;
							obj.bids.ad.cid = campaignId;
							delete obj.bids.env;
							assert(_.isEqual(obj, JSON.parse(line)));
              return esmapCB(null, retval.join("\n") + "\n");
            })) // pipe(es.map(...))
            .pipe(fs.createWriteStream(dst))
            .on('finish', function() {
              return getMD5(dst, function(err, result) {
                if (err) return asyncCB(err, null);
                try {
									resultHash[suffix] = result;
									return asyncCB(null, {totalTime : totalTime, count : count});
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
				var tasks = getTasks(false, prepareAndOperation[0], "0");
				tasks = tasks.concat(getTasks(false, prepareAndOperation[1], "1"));
        return async.series(tasks, function(err, results) {
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
					debugger;
					assert(resultHash["0"] === resultHash["1"]);
          return done();
        });
      });
      it(itName || ("test " + srcs.join(",") + " with Hash"), function(done) {
				var tasks = getTasks(true, prepareAndOperation[0], "0");
				tasks = tasks.concat(getTasks(true, prepareAndOperation[1], "1"));
        return async.series(tasks, function(err, results) {
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
					debugger;
					assert(resultHash["0"] === resultHash["1"]);
          return done();
        });
      });
    });
  };
}

module.exports = {
  testAndEval : testAndEval,
	testAndEval2 : testAndEval2
}
