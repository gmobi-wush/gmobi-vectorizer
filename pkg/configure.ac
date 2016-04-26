VERSION=0.1.0

AC_INIT([GmobiVectorizer], [${VERSION}])

AC_PROG_CC
AC_PROG_CPP

AX_CXX_COMPILE_STDCXX_11()

AC_CHECK_PROG(NPM, npm, yes)
if ! test x"${NPM}" == x"yes" ; then
  AC_MSG_ERROR([Please install npm before trying to build])
fi



AC_CONFIG_FILES([inst/package.json.in])

cd inst && npm install && cd ..

AC_OUTPUT()
