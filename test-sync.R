library(jsonlite)
library(GmobiVectorizer)
Sys.setlocale(locale = "C")
ndlist <- dir("test/ndjson")
for(fname in ndlist) {
  if (file.exists(dst.path <- file.path("test-sync", "R", fname))) file.remove(dst.path)
  dst <- file(dst.path, open = "wt")
  src <- file(file.path("test/ndjson", fname))
  open(src)
  repeat {
    .src <- readLines(src, n = 1)
    if (length(.src) == 0) break
    .obj <- fromJSON(.src, simplifyVector = TRUE, simplifyDataFrame = FALSE, simplifyMatrix = FALSE)
    .dst <- vectorize(.obj, TRUE, TRUE)
    .json <- toJSON(.dst, digits = 6)
    write(.json, file = dst)
  }
  close(src)
  close(dst)
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
