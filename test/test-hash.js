const
  _ = require('underscore'),
  fs = require('fs'),
  es = require('event-stream'),
  vectorizer = require('../');

describe("Test that vectorizer hashes the request object", function() {

  var ndjsons = fs.readdirSync("test/ndjson");
  
  _.map(ndjsons, function(fname) {
    var path = './test/ndjson/' + fname;
    it(path, function(done) {
    var s = fs.createReadStream(path)
      .pipe(es.split())
      .pipe(
        es.mapSync(function(line) {
          s.pause();
          if (line.length > 0) {
            var obj = JSON.parse(line);
            vectorizer.hash(obj);
          }
          s.resume();
        })
          .on('error', function() {
            console.log("Error while reading file!");
          })
          .on('end', function() {
            done();
          })
      ); // pipe
    });
  });

});