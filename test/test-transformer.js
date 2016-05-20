const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  assert = require('assert'),
  vectorizer = require('../'),
  check = require('check-types');

function testTransformer (desc, tester, schemas, only) {
  if (!only) {
    only = false;
  }
  if (!schemas) {
    schemas = _.filter(fs.readdirSync("test/schema"), function(s) {
      return /json$/.test(s);
    });
  }

  var d = describe;
  if (only) d = describe.only;
  d(desc, function() {
    _.chain(schemas)
      .filter(function(fname) {
        return fname === "private-example1.json";
      })
      .map(function(fname) {
        it(fname, function(done) {
          var schema = require('./schema/' + fname);
          var transformer = new vectorizer.Transformer();
          transformer.initialize(schema);
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
                assert.deepEqual(src, JSON.parse(line));
                tester(dst);
                result = JSON.stringify(dst) + "\n";
              }
            cb(null, result);
          }))
            .pipe(d);
          s.on('finish', function() {
            done();
          });
        });
      })
      .value();
  });
}

testTransformer("Test that Transformer transform the request object", function(dst) {
  return;
}, null, true);

testTransformer("Test the transformer of example2.ndjson does not contain ad.cap", function(dst) {
  assert.strictEqual(dst.ad.cap, undefined);
  return;
}, ["example2.json"]);

testTransformer("Test the transformer of example3.ndjson only creates categorical feature", function(dst) {
  var r = vectorizer.vectorize_sort(dst, true);
  _.forEach(r.x, function(x) {
    assert.equal(x, 1);
  });
}, ["example3.json"]);

testTransformer("Test the transformer of example4.ndjson creates a list of user.keyword", function(dst) {
  var r = vectorizer.vectorize_sort(dst);
  assert(check.array(dst.req.user.keywords));
  assert(check.emptyArray(_.filter(dst.req.user.keywords, function(x) {
    return x.length == 0;
  })));
}, ["example4.json"]);

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
