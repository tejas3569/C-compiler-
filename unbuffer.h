#ifndef _UNBUFFER_H_
#define _UNBUFFER_H_

#ifndef __USE_MINGW_ANSI_STDIO
#define __USE_MINGW_ANSI_STDIO 1
#endif

#include <stdio.h>

#ifdef __GNUC__
__attribute__((constructor(101))) static void __init_unbuffered_stdio__(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}
#endif

#endif
