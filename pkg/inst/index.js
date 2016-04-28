#!/usr/bin/env node

const 
  fs = require('fs'),
  zlib = require('zlib'),
  es = require('event-stream'),
  program = require('commander'),
  vectorizer = require('gmobi-vectorizer');

program
  .version('0.0.1')
  .option('-i, --input [input]', 'Input file path')
  .option('--ig', 'Input is gzipped')
  .option('-o, --output [output]', 'Output file path')
  .option('--og', 'Ouput is gzipped')
  .option('--hash', 'Whether to hash the feature or not')
  .option('--skipField', 'Skip the unsupported fields')
  .option('--skipLine', 'Skip the unsupported lines')
  .option('-s, --schema [schema]', 'The schema of the "Transformer"')
  .parse(process.argv);

var stream;
if (program.input) {
  stream = fs.createReadStream(program.input);
} else {
  process.stdin.resume();
  stream = process.stdin;
}

if (program.ig) {
  stream = stream.pipe(zlib.createGunzip());
}

var errHandler;
if (program.skipField) {
  errHandler = function(x) {
  };
} else {
  errHandler = function(x) {
    throw new Error(x);
  };
}

var transformer;
if (program.schema) {
  var obj = new vectorizer.Transformer();
  obj.initialize(require(program.schema));
  transformer = function(x) {
    return obj.transform(x);
  };
} else {
  transformer = function(x) {
    return x;
  };
}

stream = stream.pipe(es.split())
  .pipe(es.map(function(line, cb) {
    try {
      if (line.length > 0) {
        line = JSON.stringify(vectorizer.vectorize_sort(transformer(JSON.parse(line)), program.hash, errHandler));
      }
      line += "\n";
    } catch (ex) {
      if (program.skipLine) {
        line = "";
      } else {
        throw ex;
      }
    }
    cb(null, line);
  }));

if (program.og) {
  stream = stream.pipe(zlib.createGzip());
}

if (program.output) {
  stream = stream.pipe(fs.createWriteStream(program.output));
} else {
  stream = stream.pipe(process.stdout);
}

stream.on('error', function(err) {
  if (err.code !== 'EPIPE') {
    throw err;
  }
});
