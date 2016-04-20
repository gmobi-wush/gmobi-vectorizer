append_prefix <- function(prefix, key) {
  sprintf("%s%s\1", prefix, key)
}

#'@export
vectorize <- function(obj, hash = TRUE, sort = FALSE) {
  retval <- if (hash) .vectorize_hash(obj) else .vectorize(obj)
  if (sort) {
    .i <- order(retval$i)
    list(i = retval$i[.i], x = retval$x[.i])
  } else retval
}

.vectorize <- function(obj, prefix = "", retval = list(i = character(0), x = numeric(0))) {
  for(key in names(obj)) {
    if (is.list(obj[[key]])) {
      retval <- .vectorize(obj[[key]], append_prefix(prefix, key), retval)
    } else if (is.character(obj[[key]])) {
      key2 <- paste0(append_prefix(prefix, key), obj[[key]])
      retval$i <- append(retval$i, key2)
      retval$x <- append(retval$x, rep(1.0, length(obj[[key]])))
    } else if (is.numeric(obj[[key]])) {
      key2 <- paste0(prefix, key)
      retval$i <- append(retval$i, rep(key2, length(obj[[key]])))
      retval$x <- append(retval$x, obj[[key]])
    } else {
      stop(sprintf("Invalid type: %s", paste(class(obj[[key]]), collapse = ",")))
    }
  }
  retval
}

.vectorize_hash <- function(obj, prefix = "", retval = list(i = integer(0), x = numeric(0))) {
  for(key in names(obj)) {
    if (is.list(obj[[key]])) {
      retval <- .vectorize_hash(obj[[key]], append_prefix(prefix, key), retval)
    } else if (is.character(obj[[key]])) {
      key2 <- paste0(append_prefix(prefix, key), obj[[key]])
      retval$i <- append(retval$i, hash_internal(key2))
      retval$x <- append(retval$x, rep(1.0, length(obj[[key]])))
    } else if (is.numeric(obj[[key]])) {
      key2 <- paste0(prefix, key)
      retval$i <- append(retval$i, rep(hash_internal(key2), length(obj[[key]])))
      retval$x <- append(retval$x, obj[[key]])
    } else {
      stop(sprintf("Invalid type: %s", paste(class(obj[[key]]), collapse = ",")))
    }
  }
  retval
}
