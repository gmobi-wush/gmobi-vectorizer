{
  "targets": [
    {
      "target_name": "cmodule",
      "sources": [ "src/vectorizer.cpp", "src/pmurhash.c" ],
    #   'cflags_cc': ['-fexceptions', '-O3'],
    #   'cflags_cc!': ['-fno-exceptions', '-fno-rtti'],
      "link_settings": { },
      "include_dirs" : ["."],
      'conditions': [
        [ 'OS!="win"', {
          "cflags+": [ "-std=c++11", "-O3" ],
          "cflags_c+": [ "-std=c++11", "-O3" ],
          "cflags_cc+": [ "-std=c++11", "-O3" ],
        }],
        [ 'OS=="mac"', {
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS" : [ "-std=c++11", "-stdlib=libc++", "-O3" ],
            "OTHER_LDFLAGS": [ "-stdlib=libc++", "-O3" ],
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'GCC_ENABLE_CPP_RTTI': 'YES'
          },
        }],
      ]
    }
  ]
}
