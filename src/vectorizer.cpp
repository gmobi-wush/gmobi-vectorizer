#include <stdexcept>
#include <sstream>
#include <iomanip>
#include <vector>
#include <string>
#include <node.h>
#include <v8.h>
#include "pmurhash.h"
#include <cvv8/v8-convert.hpp>

using v8::Handle;
using v8::HandleScope;
using v8::Local;
using v8::Array;
using v8::String;
using v8::Number;
using v8::Undefined;
using v8::Value;
using v8::Arguments;
using v8::Exception;
using v8::Object;
using v8::FunctionTemplate;

const MH_UINT32 SEED = 20160419, SIZE = 4194304;
const std::string KEY_VALUE_SEPERATOR("\1");

unsigned int pmurhash32Internal(const std::string& obj) {
  return PMurHash32(SEED, obj.c_str(), obj.size()) % SIZE;
}

unsigned int pmurhash32Internal(const Local<Value>& obj) {
  String::Utf8Value utf8Str(obj);
  void* s = reinterpret_cast<void *>(*utf8Str);
  auto len(utf8Str.length());
  return PMurHash32(SEED, s, len) % SIZE;
}

Handle<Value> pmurhash32(const Arguments& args) {
  HandleScope scope;
  try {
    if (args.Length() != 1) {
      throw std::invalid_argument("The number of args is not 1");
    }
    if (!args[0]->IsString()) {
      throw std::invalid_argument("The first args should be String");
    }
    return scope.Close(Number::New(pmurhash32Internal(args[0])));
  } catch(std::exception& e) {
    ThrowException(Exception::Error(String::New(e.what())));
  }
  return scope.Close(Undefined());
}

template<typename T>
struct SparseVector {
  std::vector<T> i;
  std::vector<double> x;
};

void append(std::string& src, const Local<Value>& value) {
  String::Utf8Value utf8Value(value);
  char* s = reinterpret_cast<char *>(*utf8Value);
  auto len(utf8Value.length());
  src.append(s, len);
}

void vectorizeHashInternal(Local<Array>&, std::string&, SparseVector<unsigned int>&, bool);
void vectorizeHashInternal(Local<Value>&, std::string&, SparseVector<unsigned int>&, bool);

void vectorizeHashInternal(Local<Array>& arr, std::string& prefix, SparseVector<unsigned int>& retval, bool skip_field) {
  bool all_string = true, all_object = true, all_number = true;
  for(auto i = 0;i < arr->Length();i++) {
    const Local<Value>& arr_element(arr->Get(i));
    if (all_string) {
      if (!arr_element->IsString()) all_string = false;
    }
    if (all_object) {
      if (!arr_element->IsObject()) all_object = false;
    }
    if (all_number) {
      if (!arr_element->IsInt32()) all_number = false;
    }
  }
  if (all_string) {
    auto prefix_len = prefix.size();
    for(auto i = 0;i < arr->Length();i++) {
      append(prefix, arr->Get(i));
      retval.i.push_back(pmurhash32Internal(prefix));
      retval.x.push_back(1.0);
      prefix.resize(prefix_len);
    }
    return;
  } else if (all_object) {
    if (arr->Length() > 1) throw std::invalid_argument("Array of Object should only has length 1 or 0 (skipped)");
    if (arr->Length() == 1) {
      Local<Value> tmp(arr->Get(0));
      return vectorizeHashInternal(tmp, prefix, retval, skip_field);
    }
    else return;
  } else if (all_number) {
    auto prefix_len = prefix.size();
    for(auto i = 0;i < arr->Length();i++) {
      prefix.append(std::to_string(arr->Get(i)->Int32Value()));
      retval.i.push_back(pmurhash32Internal(prefix));
      retval.x.push_back(1.0);
      prefix.resize(prefix_len);
    }
    return;
  } else {
    if (skip_field) return;
    throw std::invalid_argument("The obj is array but the type is not all string or object");
  }
}

void vectorizeHashInternal(Local<Value>& obj, std::string& prefix, SparseVector<unsigned int>& retval, bool skip_field) {
  if (obj->IsString()) {
    auto prefix_len(prefix.size());
    append(prefix, obj);
    retval.i.push_back(pmurhash32Internal(prefix));
    retval.x.push_back(1.0);
    prefix.resize(prefix_len);
    return;
  }
  if (obj->IsArray()) {
    Local<Array> tmp(Local<Array>::Cast(obj));
    vectorizeHashInternal(tmp, prefix, retval, skip_field);
  }
  if (obj->IsObject()) {
    Local<Object> target(Local<Object>::Cast(obj));
    const Local<Array> properties(target->GetOwnPropertyNames());
    for(auto i = 0;i < properties->Length();i++) {
      Local<Value> key = properties->Get(i);
      Local<Value> value = target->Get(key);
      if (value->IsObject()) {
        auto prefix_len(prefix.size());
        append(prefix, key);
        prefix.append(KEY_VALUE_SEPERATOR);
        vectorizeHashInternal(value, prefix, retval, skip_field);
        prefix.resize(prefix_len);
        continue;
      } else if (value->IsString()) {
        auto prefix_len(prefix.size());
        append(prefix, key);
        prefix.append(KEY_VALUE_SEPERATOR);
        append(prefix, value);
        retval.i.push_back(pmurhash32Internal(prefix));
        retval.x.push_back(1.0);
        prefix.resize(prefix_len);
        continue;
      } else if (value->IsNumber()) {
        auto prefix_len(prefix.size());
        append(prefix, key);
        retval.i.push_back(pmurhash32Internal(prefix));
        retval.x.push_back(1.0);
        prefix.resize(prefix_len);
        continue;
      } else if (value->IsArray()) {
        auto prefix_len(prefix.size());
        append(prefix, key);
        prefix.append(KEY_VALUE_SEPERATOR);
        vectorizeHashInternal(value, prefix, retval, skip_field);
        prefix.resize(prefix_len);
        continue;
      } else if (value->IsBoolean()) {
        auto prefix_len(prefix.size());
        append(prefix, key);
        prefix.append(KEY_VALUE_SEPERATOR);
        if (value->IsTrue()) {
          prefix.append("TRUE");
        } else {
          prefix.append("FALSE");
        }
        retval.i.push_back(pmurhash32Internal(prefix));
        retval.x.push_back(1.0);
        prefix.resize(prefix_len);
        continue;
      } else {
        if (skip_field) continue;
        throw std::invalid_argument("Unsupported Type");
      }
    }
    return;
  } else if (!skip_field) {
    throw std::invalid_argument("Unsupported Type");
  }
}

Handle<Value> vectorizeHash(const Arguments& args) {
  HandleScope scope;
  try {
    if (args.Length() != 3) {
      throw std::invalid_argument("The number of args is not 3");
    }
    // no type checking
    Local<Value> obj(args[0]);
    String::Utf8Value utf8prefix(args[1]);
    bool skip_field = args[2]->IsTrue();
    char* s = reinterpret_cast<char *>(*utf8prefix);
    auto len(utf8prefix.length());
    SparseVector<unsigned int> retval;
    std::string prefix(s, len);
    vectorizeHashInternal(obj, prefix, retval, skip_field);
    Local<Object> retval_obj = Object::New();
    retval_obj->Set(String::NewSymbol("i"), cvv8::CastToJS<std::vector<unsigned int> >(retval.i));
    retval_obj->Set(String::NewSymbol("x"), cvv8::CastToJS<std::vector<double> >(retval.x));
    return scope.Close(retval_obj);
  } catch(std::exception& e) {
    ThrowException(Exception::Error(String::New(e.what())));
  }
  return scope.Close(Undefined());
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("pmurhash32"), FunctionTemplate::New(pmurhash32)->GetFunction());
  exports->Set(String::NewSymbol("vectorizeHash"), FunctionTemplate::New(vectorizeHash)->GetFunction());
}

NODE_MODULE(cmodule, init)
