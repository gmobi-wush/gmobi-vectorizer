append_prefix <- function(prefix, key) {
  sprintf("%s%s\1", prefix, key)
}

hash <- function(obj, prefix = "", retval = list(i = integer(0), x = integer(0))) {
  for(key in names(obj)) {
    if (is.list(obj[[key]])) {
      retval <- hash(obj, append_prefix(prefix, key), retval)
    } else if (is.character(obj[[key]])) {
      append_prefix(append_prefix(prefix, key), obj[[key]])
    }
  }
}