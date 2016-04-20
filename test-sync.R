library(jsonlite)
library(GmobiVectorizer)
Sys.setlocale(locale = "C")
ndlist <- dir("test/ndjson")
for(type in c("", "-raw")) {
  for(fname in ndlist) {
    if (file.exists(dst.path <- file.path("test-sync", sprintf("R%s", type), fname))) file.remove(dst.path)
    dst <- file(dst.path, open = "wt")
    src.path <- file.path("test/ndjson", fname)
    src <- switch(tools::file_ext(src.path),
                  "gz" = gzfile(src.path),
                  file(src.path)
    )
    if (interactive()) {
      .cmd <- sprintf("%s %s | wc -l",
                      switch(tools::file_ext(src.path),
                             "gz" = "gzcat",
                             "cat"),
                      src.path)
      .max <- system(.cmd, intern = TRUE)
      pb <- txtProgressBar(max = as.integer(.max))
    }
    open(src)
    repeat {
      .src <- readLines(src, n = 1000)
      if (length(.src) == 0) break
      .obj <- lapply(.src, fromJSON, simplifyVector = FALSE, simplifyDataFrame = FALSE, simplifyMatrix = FALSE)
      .dst <- lapply(.obj, vectorize, hash = (type == ""), sort = TRUE)
      .json <- sapply(.dst, toJSON, digits = 6)
      if (type == "-raw") {
        .json <- gsub("\1", "\\\\u0001", .json)
      }
      write(.json, file = dst)
      if (interactive()) setTxtProgressBar(pb, getTxtProgressBar(pb) + length(.src))
    }
    close(src)
    close(dst)
    if (interactive()) close(pb)
  }
}