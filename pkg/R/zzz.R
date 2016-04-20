#'@import digest
#'@importFrom Rcpp sourceCpp
#'@useDynLib GmobiVectorizer
.onLoad <- function(libname, pkgname) {
  Sys.setlocale(locale = "en_US.UTF-8")
}