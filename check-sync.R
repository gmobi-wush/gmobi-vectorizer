library(jsonlite)

is_pass <- TRUE

invisible(lapply(c("", "-raw"), function(type) {
  jsdir <- sprintf("test-sync/js%s", type)
  Rdir <- sprintf("test-sync/R%s", type)
  lapply(intersect(dir(jsdir), dir(Rdir)), function(fname) {
    jspath <- file.path(jsdir, fname)
    js <- lapply(readLines(jspath), fromJSON)
    Rpath <- file.path(Rdir, fname)
    R <- lapply(readLines(Rpath), fromJSON)
    if (isTRUE(all.equal(js, R))) {
      print(sprintf("%s under type: %s is passed!", fname, type))
    } else {
      print(sprintf("%s under type: %s is failed!", fname, type))
      is_pass <<- FALSE
    }
    NULL
  })
  NULL
}))
stopifnot(is_pass)