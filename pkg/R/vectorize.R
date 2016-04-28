append_prefix <- function(prefix, key) {
  sprintf("%s%s\1", prefix, key)
}

#'@export
vectorize_cli <- function(src, dst = NULL, schema = NULL, hash = FALSE, skipField = TRUE, skipLine = TRUE, intern = TRUE, verbose = TRUE) {
  src <- normalizePath(src, mustWork = TRUE)
  if (!is.null(dst)) dst <- normalizePath(dst, mustWork = TRUE)
  if (!is.null(schema)) schema <- normalizePath(schema, mustWork = TRUE)
  argv <- c()
  argv <- append(argv, sprintf("-i %s", src))
  if (tools::file_ext(src) == "gz") argv <- append(argv, "--ig")
  if (!is.null(dst)) argv <- append(argv, sprintf("-o %s", dst))
  if (!is.null(schema)) argv <- append(argv, sprintf("-s %s", schema))
  if (hash) argv <- append(argv, "--hash")
  if (skipField) argv <- append(argv, "--skipField")
  if (skipLine) argv <- append(argv, "--skipLine")
  cmd <- sprintf("node index.js %s", paste(argv, collapse = " "))
  current.wd <- getwd()
  tryCatch({
    setwd(system.file(".", package = .packageName))
    if (verbose) cat(sprintf("%s\n", cmd))
    system(cmd, intern = intern)
  }, finally = {
    setwd(current.wd)
  })
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
      if (is.null(names(obj[[key]]))) {
        if (length(obj[[key]]) == 1 & is.list(obj[[key]][[1]])) {
          stopifnot(!is.null(names(obj[[key]][[1]])))
          retval <- .vectorize(obj[[key]][[1]], append_prefix(prefix, key), retval, operator)
        } else {
          x <- unlist(obj[[key]])
          key2 <- paste0(append_prefix(prefix, key), x)
          retval$i <- append(retval$i, operator(key2))
          retval$x <- append(retval$x, rep(1.0, length(x)))
        }
      } else {
        retval <- .vectorize(obj[[key]], append_prefix(prefix, key), retval, operator)
      }
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
