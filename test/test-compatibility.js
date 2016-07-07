const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  assert = require('assert'),
  vectorizer = require('../'),
  check = require('check-types'),
  crypto = require('crypto');

function getMD5(path, cb) {
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');
  return fs.createReadStream("bid.vectorized.ndjson")
    .pipe(hash)
    .on('finish', function() {
      hash.end();
      return cb(null, hash.read());
    });
}

describe("Test that the module creates the same object as the one online", function() {
  it("Test the test/ndjson/bid.ndjson.gz", function(done) {
    var schema = require(__dirname + '/schema/bid.json');
    var transformer = new vectorizer.Transformer();
    transformer.initialize(schema);
    return fs.createReadStream("test/ndjson/bid.ndjson.gz").pipe(zlib.createGunzip())
      .pipe(es.split())
      .pipe(es.map(function(line, cb) {
        var obj;
        try {
          obj = {
            bids : JSON.parse(line)
          };
          obj.bids.ad = {
            id : "56fce4c2ac79e5824c45608e",
            cid : "56fce40aac79e5824c456086"
          };
        } catch(ex) {
          return cb(null, "");
        }
        for(var i = 0;i < 100;i++) {
          var features = transformer.transform(obj);
          var vec = vectorizer.vectorize(features, true, function(err) { });
        }
        return cb(null, JSON.stringify(vec) + "\n");
      }))
      .pipe(fs.createWriteStream("bid.vectorized.ndjson"))
      .on('finish', function() {
        return getMD5("bid.vectorized.ndjson", function(err, result) {
          if (err) throw err;
          assert(result === "5bc08dc2d50ae9fac9f820dda5e53ce6");
          return done();
        });
      });
  });
});
