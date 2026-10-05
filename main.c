#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <stdint.h>
#include <math.h>

int main(void) {
    printf("=========================================\n");
    printf("     C Compiler Verification Program     \n");
    printf("=========================================\n\n");

    // 1. Basic Output
    printf("[1] Compiler & Environment Info:\n");
    #if defined(__x86_64__) || defined(_M_X64)
        printf("    Architecture : 64-bit (x86_64)\n");
    #elif defined(__i386__) || defined(_M_IX86)
        printf("    Architecture : 32-bit (x86)\n");
    #else
        printf("    Architecture : Unknown\n");
    #endif

    #if defined(__GNUC__)
        printf("    Compiler     : GCC %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    #endif

    #if defined(__STDC_VERSION__)
        printf("    C Standard   : __STDC_VERSION__ = %ldL\n", __STDC_VERSION__);
    #endif
    printf("\n");

    // 2. Math & Standard Library Check
    double val = 144.0;
    double root = sqrt(val);
    printf("[2] Math Library Check:\n");
    printf("    sqrt(%.1f) = %.1f\n\n", val, root);

    // 3. Dynamic Memory Allocation Check
    int n = 5;
    int *arr = (int *)malloc(n * sizeof(int));
    if (arr == NULL) {
        printf("Error: Memory allocation failed!\n");
        return 1;
    }
    printf("[3] Memory Allocation Check:\n");
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
        printf("    arr[%d] = %d\n", i, arr[i]);
    }
    free(arr);
    printf("    Memory allocated and freed successfully.\n\n");

    // 4. Interactive Input Check
    int user_num = 0;
    printf("[4] Interactive Input Test (scanf):\n");
    printf("    Enter an integer number to test input: ");
    fflush(stdout);

    if (scanf("%d", &user_num) == 1) {
        printf("    Success! You entered: %d (Square = %lld)\n", user_num, (long long)user_num * user_num);
    } else {
        printf("    No input provided or input failed.\n");
    }

    printf("\n=========================================\n");
    printf("All basic C features are working properly!\n");
    printf("=========================================\n");

    return 0;
}
