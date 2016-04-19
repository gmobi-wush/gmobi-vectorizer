#include <cstring>
#include <Rcpp.h>
#include "digestlocal.h"

using namespace Rcpp;

//'@export
//[[Rcpp::export]]
SEXP hash_internal(CharacterVector s, int seed = 20160419, int size = 4194304) {
  IntegerVector retval(s.size());
  for(R_len_t i = 0;i < s.size();i++) {
    const char* str = CHAR(s[i]);
    retval[i] = PMurHash32(seed, str, strlen(str)) % size;
  }
  return retval;
}
