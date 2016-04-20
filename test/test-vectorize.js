const
  _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  es = require('event-stream'),
  vectorizer = require('../');

describe.only("Test that vectorizer vectorize the request object", function() {

  var ndjsons = _.filter(fs.readdirSync("test/ndjson"), function(s) {
    return /ndjson$/.test(s);
  });
  
  _.map(["js-raw", "js"], function(type) {
    var is_hash = (type === "js");
    describe("Type: " + type, function() {
      _.map(ndjsons, function(fname) {
        var spath = './test/ndjson/' + fname;
        var dpath = './test-sync/' + type + '/' + fname;
        it(spath, function(done) {
          var d = fs.createWriteStream(dpath);
          var s0;
          if (path.extname(spath) === '.ndjson') {
            s0 = fs.createReadStream(spath);
          } else if (path.extname(spath) === '.gz') {
            this.timeout(100000);
            s0 = fs.createReadStream(spath).pipe(zlib.createGunzip());
          }
          var s = s0.pipe(es.split())
            .pipe(es.map(function(line, cb) {
              var result;
              if (line.length > 0) {
                result = JSON.stringify(vectorizer.vectorize_sort(JSON.parse(line), is_hash)) + "\n";
              } else {
                result = "";
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
  });
});