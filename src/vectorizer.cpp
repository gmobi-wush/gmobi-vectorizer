#include <stdexcept>
#include <sstream>
#include <iomanip>
#include <node.h>
#include <v8.h>
#include "pmurhash.h"

using v8::Handle;
using v8::HandleScope;
using v8::String;
using v8::Number;
using v8::Undefined;
using v8::Value;
using v8::Arguments;
using v8::Exception;
using v8::Object;
using v8::FunctionTemplate;

const MH_UINT32 SEED = 20160419, SIZE = 4194304;

Handle<Value> pmurhash32(const Arguments& args) {
  HandleScope scope;
  try {
    if (args.Length() != 1) {
      throw std::invalid_argument("The number of args is not 1");
    }
    if (!args[0]->IsString()) {
      throw std::invalid_argument("The first args should be String");
    }
    String::Utf8Value utf8Str(args[0]);
    void* s = reinterpret_cast<void *>(*utf8Str);
    auto len(utf8Str.length());
    unsigned int retval =PMurHash32(SEED, s, len) % SIZE;
    return scope.Close(Number::New(retval));
  } catch(std::exception& e) {
    ThrowException(Exception::Error(String::New(e.what())));
  }
  return scope.Close(Undefined());
}

Handle<Value> vectorize(const Arguments& args) {
  HandleScope scope;
  try {
    if (args.Length() != 5) {
      throw std::invalid_argument("The number of args is not 5");
    }
  } catch(std::exception& e) {
    ThrowException(Exception::Error(String::New(e.what())));
  }
  return scope.Close(Undefined());
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("pmurhash32"),
      FunctionTemplate::New(pmurhash32)->GetFunction());
}

NODE_MODULE(cmodule, init)
