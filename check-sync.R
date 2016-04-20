library(jsonlite)
js <- fromJSON(readLines("test-sync/js-raw/example.ndjson", n = 1))
R <- fromJSON(readLines("test-sync/R-raw/example.ndjson", n = 1))

stopifnot(all(js$i == R$i))
stopifnot(all(js$x == R$x))

js <- fromJSON(readLines("test-sync/js/example.ndjson", n = 1))
R <- fromJSON(readLines("test-sync/R/example.ndjson", n = 1))

stopifnot(all(js$i == R$i))
stopifnot(all(js$x == R$x))
