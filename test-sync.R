library(jsonlite)
library(GmobiVectorizer)
Sys.setlocale(locale = "C")
ndlist <- dir("test/ndjson")
for(fname in ndlist) {
  if (file.exists(dst.path <- file.path("test-sync", "R", fname))) file.remove(dst.path)
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
    .obj <- lapply(.src, fromJSON, simplifyVector = TRUE, simplifyDataFrame = FALSE, simplifyMatrix = FALSE)
    .dst <- lapply(.obj, vectorize, hash = TRUE, sort = TRUE)
    .json <- sapply(.dst, toJSON, digits = 6)
    write(.json, file = dst)
    if (interactive()) setTxtProgressBar(pb, getTxtProgressBar(pb) + length(.src))
  }
  close(src)
  close(dst)
  if (interactive()) close(pb)
}

for(fname in ndlist) {
  if (file.exists(dst.path <- file.path("test-sync", "R-raw", fname))) file.remove(dst.path)
  dst <- file(dst.path, open = "wt")
  src <- file(file.path("test/ndjson", fname))
  open(src)
  repeat {
    .src <- readLines(src, n = 1)
    if (length(.src) == 0) break
    .obj <- fromJSON(.src, simplifyVector = TRUE, simplifyDataFrame = FALSE, simplifyMatrix = FALSE)
    .dst <- vectorize(.obj, FALSE, TRUE)
    .json <- toJSON(.dst, digits = 6)
    .json <- gsub("\1", "\\\\u0001", .json)
    write(.json, file = dst)
  }
  close(src)
  close(dst)
}
