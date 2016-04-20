const
  _ = require('underscore'),
  fs = require('fs'),
  es = require('event-stream'),
  vectorizer = require('../');

describe("Test that vectorizer vectorize the request object", function() {

  var ndjsons = fs.readdirSync("test/ndjson");
  
  describe("Raw key", function() {
    _.map(ndjsons, function(fname) {
      var spath = './test/ndjson/' + fname;
      var dpath = './test-sync/js-raw/' + fname;
      it(spath, function(done) {
        var d = fs.createWriteStream(dpath);
        var s = fs.createReadStream(spath)
          .pipe(es.split())
          .pipe(es.map(function(line, cb) {
            var result;
            if (line.length > 0) {
              result = JSON.stringify(vectorizer.vectorize_sort(JSON.parse(line), false)) + "\n";
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
  
  describe("Hashed key", function() {
    _.map(ndjsons, function(fname) {
      var spath = './test/ndjson/' + fname;
      var dpath = './test-sync/js/' + fname;
      it(spath, function(done) {
        var d = fs.createWriteStream(dpath);
        var s = fs.createReadStream(spath)
          .pipe(es.split())
          .pipe(es.map(function(line, cb) {
            var result;
            if (line.length > 0) {
              result = JSON.stringify(vectorizer.vectorize_sort(JSON.parse(line), true)) + "\n";
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