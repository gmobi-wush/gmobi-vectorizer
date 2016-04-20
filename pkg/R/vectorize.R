append_prefix <- function(prefix, key) {
  sprintf("%s%s\1", prefix, key)
}

#'@export
vectorize <- function(obj, hash = TRUE, sort = FALSE) {
  retval <- if (hash) {
    .vectorize(obj, retval = list(i = integer(0), x = numeric(0)), operator = hash_internal)
  } else .vectorize(obj)
  if (sort) {
    .i <- order(retval$i)
    list(i = retval$i[.i], x = retval$x[.i])
  } else retval
}

.vectorize <- function(obj, prefix = "", retval = list(i = character(0), x = numeric(0)), operator = function(x) x) {
  for(key in names(obj)) {
    if (is.list(obj[[key]])) {
      retval <- .vectorize(obj[[key]], append_prefix(prefix, key), retval, operator)
    } else if (is.character(obj[[key]])) {
      key2 <- paste0(append_prefix(prefix, key), obj[[key]])
      retval$i <- append(retval$i, operator(key2))
      retval$x <- append(retval$x, rep(1.0, length(obj[[key]])))
    } else if (is.numeric(obj[[key]])) {
      key2 <- paste0(prefix, key)
      if (length(obj[[key]]) != 1) {
        if (interactive()) browser()
        stop("")
      }
      retval$i <- append(retval$i, operator(rep(key2, 1)))
      retval$x <- append(retval$x, obj[[key]])
    } else if (is.logical(obj[[key]])) {
      key2 <- paste0(append_prefix(prefix, key), obj[[key]])
      if (length(obj[[key]]) != 1) {
        if (interactive()) browser()
        stop("")
      }
      retval$i <- append(retval$i, operator(rep(key2, length(obj[[key]]))))
      retval$x <- append(retval$x, 1.0)
    } else {
      if (interactive()) browser()
      stop(sprintf("Invalid type: %s", paste(class(obj[[key]]), collapse = ",")))
    }
  }
  retval
}
