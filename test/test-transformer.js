const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  assert = require('assert'),
  vectorizer = require('../');

describe("Test that Transformer transform the request object", function() {

  var schemas = _.filter(fs.readdirSync("test/schema"), function(s) {
    return /json$/.test(s);
  });
  
  _.map(schemas, function(fname) {
    it(fname, function(done) {
      var schemas = require('./schema/' + fname);
      var transformer = new vectorizer.Transformer();
      transformer.initialize(schemas);
      var spath = './test/ndjson/' + fname.replace('json', 'ndjson');
      var dpath = './test-sync/js/' + fname.replace('json', 'transform.ndjson');
      var d = fs.createWriteStream(dpath);
      var s0 = fs.createReadStream(spath);
      var s = s0.pipe(es.split())
        .pipe(es.map(function(line, cb) {
          var result;
          if (line.length > 0) {
            var src = JSON.parse(line);
            var dst = transformer.transform(src);
            if (fname == "example2.json") {
              assert.strictEqual(dst.ad.cap, undefined);
            }
            result = JSON.stringify(dst) + "\n";
            assert.deepEqual(src, JSON.parse(line));
            r = vectorizer.vectorize_sort(dst, true);
            if (!!fname.match(/example3.ndjson/)) {
              _.forEach(r.x, function(x) {
                assert.equal(x, 1);
              });
            }            
          }
        cb(null, result);
      }))
        .pipe(d);
      s.on('finish', function() {
        done();
      });
    });
  });

});

describe("Test that Required Transformer throws error if the property is not existed", function() {
  var fname = "example.json";
  it(fname, function(done) {
    var schemas = require("./error-schema/" + fname);
    var transformer = new vectorizer.Transformer();
    transformer.initialize(schemas);
    var spath = './test/ndjson/' + fname.replace('json', 'ndjson');
    var s0 = fs.createReadStream(spath);
    var index = 0;
    var s = s0.pipe(es.split())
      .pipe(es.map(function(line, cb) {
        var result;
        if (line.length > 0) {
          var obj = JSON.parse(line);
          if (index == 0) {
            (function() {
              transformer.transform(obj);
            }).should.not.throw();
            index += 1;
          } else {
            (function() {
              transformer.transform(obj);
            }).should.throw(/city/);
          }
        }
        cb(null, "");
      }));
    s.on('end', function() {
      done();
    });
  });
  
});
