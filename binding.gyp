{
  "targets": [
    {
      "target_name": "cmodule",
      "sources": [ "src/vectorizer.cpp", "src/pmurhash.c" ],
      'cflags_cc': ['-fexceptions'],
      'cflags_cc!': ['-fno-exceptions', '-fno-rtti'],
      "link_settings": {
      },
      'conditions': [
        [ 'OS!="win"', {
          "cflags+": [ "-std=c++11" ],
          "cflags_c+": [ "-std=c++11" ],
          "cflags_cc+": [ "-std=c++11" ],
        }],
        [ 'OS=="mac"', {
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS" : [ "-std=c++11", "-stdlib=libc++" ],
            "OTHER_LDFLAGS": [ "-stdlib=libc++" ],
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'GCC_ENABLE_CPP_RTTI': 'YES'
          },
        }],
      ]
    }
  ]
}
