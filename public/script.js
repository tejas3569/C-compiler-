// Online C Compiler - Client Application
(function () {
  'use strict';

  // Code Templates
  const TEMPLATES = {
    hello: `// Online C Compiler - GCC
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
    scanf_user: `// Single Value Input (scanf) Test
#include <stdio.h>

int main() {
    int a;
    printf("value a = ");
    if (scanf("%d", &a) == 1) {
        printf("value of a is %d\\n", a);
    }
    return 0;
}
`,
    interactive: `// Interactive Input (scanf) Demo
#include <stdio.h>

int main() {
    char name[50];
    int age;

    printf("Enter your name: ");
    if (scanf("%49s", name) != 1) return 1;

    printf("Enter your age: ");
    if (scanf("%d", &age) != 1) return 1;

    printf("\\nHello %s! You are %d years old.\\n", name, age);
    return 0;
}
`,
    loops: `// Loops & Arrays Demo
#include <stdio.h>

int main() {
    int numbers[] = {12, 45, 78, 23, 56, 91, 34};
    int count = sizeof(numbers) / sizeof(numbers[0]);
    int sum = 0;
    int max = numbers[0];

    printf("Array Elements:\\n");
    for (int i = 0; i < count; i++) {
        printf("numbers[%d] = %d\\n", i, numbers[i]);
        sum += numbers[i];
        if (numbers[i] > max) max = numbers[i];
    }

    printf("\\nTotal Sum : %d\\n", sum);
    printf("Average   : %.2f\\n", (float)sum / count);
    printf("Maximum   : %d\\n", max);

    return 0;
}
`,
    pointers: `// Dynamic Memory & Pointers Demo
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;
    printf("Allocating memory for %d integers using malloc()...\\n", n);
    int *arr = (int *)malloc(n * sizeof(int));

    if (arr == NULL) {
        fprintf(stderr, "Memory allocation failed!\\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
        printf("arr[%d] = %d (address: %p)\\n", i, arr[i], (void *)&arr[i]);
    }

    free(arr);
    printf("Memory freed successfully!\\n");
    return 0;
}
`,
    structs: `// Structs & Records
#include <stdio.h>

typedef struct {
    int id;
    char name[20];
    float gpa;
} Student;

void printStudent(const Student *s) {
    printf("ID: %d | Name: %-8s | GPA: %.2f\\n", s->id, s->name, s->gpa);
}

int main() {
    Student students[3] = {
        {101, "Alice", 3.92},
        {102, "Bob",   3.65},
        {103, "Charlie", 3.88}
    };

    printf("Student Records:\\n");
    for (int i = 0; i < 3; i++) {
        printStudent(&students[i]);
    }
    return 0;
}
`,
    recursion: `// Fibonacci & Recursion Demo
#include <stdio.h>

long long fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n = 12;
    printf("Fibonacci Sequence (First %d numbers):\\n", n);
    for (int i = 0; i < n; i++) {
        printf("F(%2d) = %lld\\n", i, fibonacci(i));
    }
    return 0;
}
`,
    math: `// Math Library Demo (-lm)
#include <stdio.h>
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

int main() {
    double x = 16.0;
    double deg = 45.0;
    double rad = deg * (M_PI / 180.0);

    printf("sqrt(%.1f)       = %.4f\\n", x, sqrt(x));
    printf("pow(2.0, 10.0)   = %.1f\\n", pow(2.0, 10.0));
    printf("sin(45 deg)      = %.4f\\n", sin(rad));
    printf("cos(45 deg)      = %.4f\\n", cos(rad));
    printf("ceil(3.14)       = %.1f\\n", ceil(3.14));
    printf("floor(3.99)      = %.1f\\n", floor(3.99));

    return 0;
}
`,
    strings: `// String Processing Demo
#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main() {
    char str[] = "Online C Compiler with GCC!";
    int len = strlen(str);
    int vowels = 0;

    printf("Original: %s\\n", str);
    printf("Length  : %d\\n", len);

    for (int i = 0; i < len; i++) {
        char c = tolower(str[i]);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vowels++;
        }
    }

    printf("Vowels Count: %d\\n", vowels);
    return 0;
}
`
  };

  // State
  let editor = null;
  let ws = null;
  let isRunning = false;
  let activeInteractiveSession = null;
  let currentFontSize = 14;
  let currentTheme = localStorage.getItem('c_compiler_theme') || 'dark';

  // DOM Elements
  const runBtn = document.getElementById('runBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearCodeBtn = document.getElementById('clearCodeBtn');
  const formatBtn = document.getElementById('formatBtn');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const uploadInput = document.getElementById('uploadInput');
  const exampleSelect = document.getElementById('exampleSelect');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const fontDecBtn = document.getElementById('fontDecBtn');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const terminal = document.getElementById('terminal');
  const clearOutputBtn = document.getElementById('clearOutputBtn');
  const copyOutputBtn = document.getElementById('copyOutputBtn');
  const interactiveInputForm = document.getElementById('interactiveInputForm');
  const interactiveInputField = document.getElementById('interactiveInputField');
  const customStdinText = document.getElementById('customStdinText');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const metricCompile = document.getElementById('metricCompile');
  const metricExec = document.getElementById('metricExec');
  const metricExit = document.getElementById('metricExit');
  const cursorPos = document.getElementById('cursorPos');
  const splitter = document.getElementById('splitter');
  const editorPane = document.getElementById('editorPane');
  const outputPane = document.getElementById('outputPane');
  const codeFallback = document.getElementById('codeTextarea');
  const workspace = document.getElementById('workspace');
  const mobileTabCode = document.getElementById('mobileTabCode');
  const mobileTabConsole = document.getElementById('mobileTabConsole');
  const mobileConsoleDot = document.getElementById('mobileConsoleDot');
  const mobileToolsBtn = document.getElementById('mobileToolsBtn');
  const mobileToolsDropdown = document.getElementById('mobileToolsDropdown');

  // Initialize Theme
  applyTheme(currentTheme);

  // Initialize Monaco Editor
  initEditor();

  // Setup WebSocket connection
  initWebSocket();

  // Load Saved Code or Default
  const initialCode = localStorage.getItem('c_compiler_code') || TEMPLATES.hello;
  codeFallback.value = initialCode;

  // Event Listeners
  runBtn.addEventListener('click', () => handleRun());
  stopBtn.addEventListener('click', handleStop);
  clearCodeBtn.addEventListener('click', handleResetCode);
  formatBtn.addEventListener('click', handleFormatCode);
  copyCodeBtn.addEventListener('click', handleCopyCode);
  downloadBtn.addEventListener('click', handleDownloadCode);
  uploadInput.addEventListener('change', handleUploadCode);
  exampleSelect.addEventListener('change', handleExampleChange);
  themeToggleBtn.addEventListener('click', toggleTheme);
  fontDecBtn.addEventListener('click', () => changeFontSize(-1));
  fontIncBtn.addEventListener('click', () => changeFontSize(1));
  clearOutputBtn.addEventListener('click', () => { terminal.innerHTML = ''; });
  copyOutputBtn.addEventListener('click', handleCopyOutput);

  // Mobile View Switcher
  function switchMobileView(view) {
    if (view === 'console') {
      workspace.classList.add('show-output');
      if (mobileTabConsole) mobileTabConsole.classList.add('active');
      if (mobileTabCode) mobileTabCode.classList.remove('active');
      if (mobileConsoleDot) mobileConsoleDot.style.display = 'none';
    } else {
      workspace.classList.remove('show-output');
      if (mobileTabCode) mobileTabCode.classList.add('active');
      if (mobileTabConsole) mobileTabConsole.classList.remove('active');
      if (editor) {
        setTimeout(() => editor.layout(), 60);
      }
    }
  }

  if (mobileTabCode) {
    mobileTabCode.addEventListener('click', () => switchMobileView('code'));
  }
  if (mobileTabConsole) {
    mobileTabConsole.addEventListener('click', () => switchMobileView('console'));
  }

  // Mobile Tools Menu
  if (mobileToolsBtn && mobileToolsDropdown) {
    mobileToolsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileToolsDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!mobileToolsDropdown.contains(e.target) && e.target !== mobileToolsBtn) {
        mobileToolsDropdown.classList.remove('open');
      }
    });

    const bindTool = (id, handler) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          mobileToolsDropdown.classList.remove('open');
          handler();
        });
      }
    };

    bindTool('mobileToolFormat', handleFormatCode);
    bindTool('mobileToolCopy', handleCopyCode);
    bindTool('mobileToolReset', handleResetCode);
    bindTool('mobileToolDownload', handleDownloadCode);

    const mUpload = document.getElementById('mobileUploadInput');
    if (mUpload) {
      mUpload.addEventListener('change', (e) => {
        mobileToolsDropdown.classList.remove('open');
        handleUploadCode(e);
      });
    }

    const mFontDec = document.getElementById('mobileFontDec');
    if (mFontDec) {
      mFontDec.addEventListener('click', () => changeFontSize(-1));
    }
    const mFontInc = document.getElementById('mobileFontInc');
    if (mFontInc) {
      mFontInc.addEventListener('click', () => changeFontSize(1));
    }
  }

  // Tabs switching in Output Pane
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Interactive Input Form submission
  interactiveInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = interactiveInputField.value.trim();
    if (!val) return;

    // WebSocket real-time mode (local MinGW GCC)
    if (ws && ws.readyState === WebSocket.OPEN && isRunning && !activeInteractiveSession) {
      sendStdin(val + '\n');
      interactiveInputField.value = '';
      return;
    }

    // Active interactive step-by-step session
    if (activeInteractiveSession) {
      interactiveInputField.value = '';
      appendOutput(val + '\n', 'term-input');
      activeInteractiveSession.inputs.push(val);
      activeInteractiveSession.promptIndex++;

      // Check if there are more prompts to ask
      if (activeInteractiveSession.promptIndex < activeInteractiveSession.prompts.length) {
        const nextPrompt = activeInteractiveSession.prompts[activeInteractiveSession.promptIndex];
        appendOutput(nextPrompt, 'term-stdout');
        const cleanPromptLabel = nextPrompt.replace(/[:=\s]+$/, '').trim() || 'input';
        interactiveInputField.placeholder = `👉 Enter ${cleanPromptLabel}... (Press Enter)`;
        interactiveInputField.focus();
        setStatus('busy', `Waiting for input: ${nextPrompt.trim()}`);
      } else {
        // All prompts collected! Execute the program now!
        const finalStdin = activeInteractiveSession.inputs.join('\n') + '\n';
        const session = activeInteractiveSession;
        activeInteractiveSession = null;
        executeProgramAfterPrompts(session, finalStdin);
      }
      return;
    }

    // Direct run with input if not in active session
    interactiveInputField.value = '';
    customStdinText.value = val;
    handleRun(val + '\n');
  });

  // Clicking terminal focuses interactive input when running
  terminal.addEventListener('click', () => {
    interactiveInputField.focus();
  });

  // Typing in terminal forwards to interactive input field
  terminal.addEventListener('keydown', (e) => {
    if (isRunning && document.activeElement !== interactiveInputField) {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        interactiveInputField.focus();
      }
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    } else if (e.key === 'Escape' && isRunning) {
      e.preventDefault();
      handleStop();
    }
  });

  // Splitter Resize Logic
  initSplitter();

  // Check Compiler API Status
  fetchCompilerStatus();

  // Functions
  function initEditor() {
    if (window.require) {
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      window.require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('monacoContainer'), {
          value: initialCode,
          language: 'c',
          theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
          fontSize: currentFontSize,
          fontFamily: "'Fira Code', Consolas, monospace",
          fontLigatures: true,
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on'
        });

        codeFallback.style.display = 'none';

        editor.onDidChangeCursorPosition((e) => {
          cursorPos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        editor.onDidChangeModelContent(() => {
          localStorage.setItem('c_compiler_code', editor.getValue());
        });
      });
    } else {
      // Fallback textarea
      codeFallback.style.display = 'block';
      codeFallback.addEventListener('input', () => {
        localStorage.setItem('c_compiler_code', codeFallback.value);
      });
    }
  }

  function getCode() {
    if (editor) return editor.getValue();
    return codeFallback.value;
  }

  function setCode(val) {
    if (editor) {
      editor.setValue(val);
    } else {
      codeFallback.value = val;
    }
    localStorage.setItem('c_compiler_code', val);
  }

  function initWebSocket() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      console.log('Running on cloud (Vercel mode) - using Cloud GCC API');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Interactive WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWsMessage(msg);
        } catch (e) {
          appendOutput(event.data, 'term-info');
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 2s...');
        setTimeout(initWebSocket, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error, falling back to HTTP API when running:', err);
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }
  }

  function handleWsMessage(msg) {
    switch (msg.type) {
      case 'status':
        setStatus('busy', msg.message);
        appendOutput(`[${msg.message}]\n`, 'term-info');
        if (msg.compTime !== undefined) {
          showMetrics(msg.compTime, null, null);
        }
        break;

      case 'stdout':
        appendOutput(msg.data, 'term-stdout');
        break;

      case 'stderr':
        appendOutput(msg.data, 'term-error');
        break;

      case 'compile_warning':
        appendOutput(`[Compiler Warnings]:\n${msg.warning}\n`, 'term-warning');
        break;

      case 'compile_error':
        setRunningState(false);
        setStatus('error', 'Compilation Error');
        appendOutput(`\n❌ Compilation Error:\n${msg.error}\n`, 'term-error');
        showMetrics(msg.compTime, null, 1);
        break;

      case 'exit':
        setRunningState(false);
        const isSuccess = msg.exitCode === 0;
        setStatus(isSuccess ? 'ready' : 'error', `Exited with code ${msg.exitCode}`);
        appendOutput(`\n=== Process exited with code ${msg.exitCode} ===\n`, isSuccess ? 'term-meta' : 'term-error');
        showMetrics(null, msg.execTime, msg.exitCode);
        break;

      case 'error':
        appendOutput(msg.data, 'term-error');
        break;
    }
  }

  function handleRun(explicitStdin) {
    if (isRunning) return;

    const code = getCode().trim();
    if (!code) {
      alert('Please enter some C code to compile and run.');
      return;
    }

    // Switch to output console tab
    document.querySelector('.tab-btn[data-target="consoleTab"]').click();

    // On mobile, auto-switch view to console tab so user sees output & prompts immediately
    if (window.innerWidth <= 768) {
      switchMobileView('console');
    }

    // Clear previous output & reset metrics
    activeInteractiveSession = null;
    terminal.innerHTML = '';
    resetMetrics();

    // Check if user provided explicit stdin or batch input in Custom STDIN tab
    const customStdin = customStdinText ? customStdinText.value.trim() : '';
    const hasExplicitStdin = typeof explicitStdin === 'string' && explicitStdin.trim();

    // Use WebSocket if connected for local real-time mode
    if (ws && ws.readyState === WebSocket.OPEN && !customStdin && !hasExplicitStdin) {
      setRunningState(true);
      setStatus('busy', 'Compiling with GCC...');
      ws.send(JSON.stringify({
        type: 'run',
        code: code
      }));
      return;
    }

    // Cloud / HTTP mode:
    // If user provided input in advance, run immediately
    if (hasExplicitStdin || customStdin) {
      setRunningState(true);
      setStatus('busy', 'Compiling with GCC...');
      runViaHttp(code, hasExplicitStdin ? explicitStdin : customStdin);
      return;
    }

    // Check if program asks for input (scanf, getchar, fgets)
    const prompts = getInteractivePrompts(code);
    if (prompts.length > 0) {
      // ASK THE USER FIRST!
      setRunningState(true);
      setStatus('busy', `Waiting for input: ${prompts[0].trim()}`);
      appendOutput(`[Compiling and executing via Cloud GCC (Vercel)...]\n`, 'term-info');
      appendOutput(prompts[0], 'term-stdout');

      activeInteractiveSession = {
        code: code,
        prompts: prompts,
        promptIndex: 0,
        inputs: []
      };

      interactiveInputForm.classList.add('is-waiting');
      const cleanPromptLabel = prompts[0].replace(/[:=\s]+$/, '').trim() || 'input';
      interactiveInputField.placeholder = `👉 Enter ${cleanPromptLabel}... (Press Enter)`;
      interactiveInputField.value = '';
      setTimeout(() => interactiveInputField.focus(), 50);
      return;
    }

    // No inputs required (e.g. Hello World, math, loops)
    setRunningState(true);
    setStatus('busy', 'Compiling with GCC...');
    runViaHttp(code, '');
  }

  async function executeProgramAfterPrompts(session, finalStdin) {
    try {
      setStatus('busy', 'Executing with input...');
      interactiveInputForm.classList.remove('is-waiting');
      interactiveInputField.placeholder = 'Executing program...';

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, stdin: finalStdin })
      });

      const data = await res.json();
      setRunningState(false);

      if (data.status === 'compile_error') {
        setStatus('error', 'Compilation Failed');
        appendOutput(`\n❌ Compilation Error:\n${data.compilationError}\n`, 'term-error');
        showMetrics(data.compileTimeMs, null, 1);
        return;
      }

      if (data.compilationWarnings && data.compilationWarnings.trim()) {
        appendOutput(`[Warnings]:\n${data.compilationWarnings}\n`, 'term-warning');
      }

      if (data.status === 'timeout') {
        setStatus('error', 'Time Limit Exceeded');
        appendOutput(`\n❌ ${data.error}\n`, 'term-error');
        showMetrics(data.compileTimeMs, data.executionTimeMs, -1);
        return;
      }

      // The prompts and inputs were ALREADY displayed interactively!
      // Strip prompts from the returned output so only the final output displays!
      const raw = data.rawOutput || data.output || '';
      const remainingOutput = stripEchoedPrompts(session.prompts, raw);
      if (remainingOutput) {
        appendOutput(remainingOutput, 'term-stdout');
      }

      if (data.error) {
        appendOutput(data.error, 'term-error');
      }

      const isSuccess = data.exitCode === 0;
      setStatus(isSuccess ? 'ready' : 'error', `Exited with code ${data.exitCode}`);
      appendOutput(`\n=== Process exited with code ${data.exitCode} ===\n`, isSuccess ? 'term-meta' : 'term-error');
      showMetrics(data.compileTimeMs, data.executionTimeMs, data.exitCode);

    } catch (err) {
      setRunningState(false);
      setStatus('error', 'Execution Error');
      appendOutput(`\nNetwork or server error: ${err.message}\n`, 'term-error');
    }
  }

  async function runViaHttp(code, rawStdin) {
    const stdin = typeof rawStdin === 'string' ? rawStdin : '';
    try {
      const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      appendOutput(`[Compiling and executing via ${isCloud ? 'Cloud GCC (Vercel)' : 'GCC'}...]\n`, 'term-info');
      
      const hasPrompts = /(?:printf|puts|fputs)\s*\(\s*"([^"]+)"(?:(?!printf|puts|fputs)[\s\S])*?(?:scanf|getchar|fgets|fgetc|getc)\s*\(/i.test(code);
      if (!hasPrompts && stdin && stdin.trim()) {
        appendOutput(`[Input (stdin): ${stdin.trim()}]\n`, 'term-input');
      }
      const startTime = Date.now();

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin })
      });

      const data = await res.json();
      setRunningState(false);

      if (data.status === 'compile_error') {
        setStatus('error', 'Compilation Failed');
        appendOutput(`\n❌ Compilation Error:\n${data.compilationError}\n`, 'term-error');
        showMetrics(data.compileTimeMs, null, 1);
        return;
      }

      if (data.compilationWarnings && data.compilationWarnings.trim()) {
        appendOutput(`[Warnings]:\n${data.compilationWarnings}\n`, 'term-warning');
      }

      if (data.status === 'timeout') {
        setStatus('error', 'Time Limit Exceeded');
        if (data.output) appendOutput(data.output, 'term-stdout');
        appendOutput(`\n❌ ${data.error}\n`, 'term-error');
        showMetrics(data.compileTimeMs, data.executionTimeMs, -1);
        return;
      }

      if (data.output) {
        appendOutput(data.output, 'term-stdout');
      }

      if (data.error) {
        appendOutput(data.error, 'term-error');
      }

      const isSuccess = data.exitCode === 0;
      setStatus(isSuccess ? 'ready' : 'error', `Exited with code ${data.exitCode}`);
      appendOutput(`\n=== Process exited with code ${data.exitCode} ===\n`, isSuccess ? 'term-meta' : 'term-error');
      showMetrics(data.compileTimeMs, data.executionTimeMs, data.exitCode);

    } catch (err) {
      setRunningState(false);
      setStatus('error', 'Execution Error');
      appendOutput(`\nNetwork or server error: ${err.message}\n`, 'term-error');
    }
  }

  function handleStop() {
    if (activeInteractiveSession) {
      activeInteractiveSession = null;
      setRunningState(false);
      setStatus('ready', 'Stopped by user');
      appendOutput('\n[Stopped by user]\n', 'term-error');
      return;
    }
    if (!isRunning) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }));
    }
    setRunningState(false);
    setStatus('ready', 'Stopped by user');
  }

  function sendStdin(data) {
    if (!isRunning) return;
    appendOutput(data, 'term-input');
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'stdin',
        data: data
      }));
    }
  }

  function appendOutput(text, className = '') {
    const span = document.createElement('span');
    if (className) span.className = className;
    span.textContent = text;
    terminal.appendChild(span);
    terminal.scrollTop = terminal.scrollHeight;

    // Show output notification dot if user is currently looking at mobile Code view
    if (mobileConsoleDot && window.innerWidth <= 768 && !workspace.classList.contains('show-output')) {
      mobileConsoleDot.style.display = 'inline-block';
    }
  }

  function setRunningState(running) {
    isRunning = running;
    runBtn.disabled = running;
    stopBtn.disabled = !running;
    if (running) {
      interactiveInputForm.classList.add('is-waiting');
      interactiveInputField.placeholder = '👉 Type input for scanf() (e.g. 45) and press Enter...';
      interactiveInputField.disabled = false;
      setTimeout(() => interactiveInputField.focus(), 50);
    } else {
      interactiveInputForm.classList.remove('is-waiting');
      const code = getCode();
      const hasInputFn = /\b(scanf|getchar|getc|fgets|fgetc|gets)\s*\(/.test(code);
      if (hasInputFn) {
        interactiveInputField.placeholder = 'Type input for scanf() (e.g. 45) and press Enter...';
      } else {
        interactiveInputField.placeholder = 'Program finished. Click Run (Ctrl+Enter) to execute.';
      }
      interactiveInputField.disabled = false;
    }
  }

  function setStatus(state, text) {
    statusIndicator.className = `status-indicator ${state}`;
    statusText.textContent = text;
  }

  function showMetrics(compileMs, execMs, exitCode) {
    if (compileMs !== null && compileMs !== undefined) {
      metricCompile.textContent = `Compile: ${compileMs}ms`;
      metricCompile.style.display = 'inline';
    }
    if (execMs !== null && execMs !== undefined) {
      metricExec.textContent = `Execute: ${execMs}ms`;
      metricExec.style.display = 'inline';
    }
    if (exitCode !== null && exitCode !== undefined) {
      metricExit.textContent = `Exit: ${exitCode}`;
      metricExit.className = `metric-badge ${exitCode === 0 ? 'success' : 'fail'}`;
      metricExit.style.display = 'inline';
    }
  }

  function resetMetrics() {
    metricCompile.style.display = 'none';
    metricExec.style.display = 'none';
    metricExit.style.display = 'none';
  }

  function handleExampleChange() {
    const key = exampleSelect.value;
    if (TEMPLATES[key]) {
      if (confirm('Load example? Any unsaved edits will be replaced.')) {
        setCode(TEMPLATES[key]);
      }
    }
  }

  function handleResetCode() {
    if (confirm('Reset to default Hello World template?')) {
      setCode(TEMPLATES.hello);
    }
  }

  function handleFormatCode() {
    if (editor) {
      editor.getAction('editor.action.formatDocument')?.run();
    }
  }

  function handleCopyCode() {
    const code = getCode();
    navigator.clipboard.writeText(code).then(() => {
      showToast('Code copied to clipboard!');
    });
  }

  function handleCopyOutput() {
    const text = terminal.innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Output copied to clipboard!');
    });
  }

  function handleDownloadCode() {
    const code = getCode();
    const blob = new Blob([code], { type: 'text/x-csrc' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.c';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleUploadCode(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCode(evt.target.result);
      showToast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function changeFontSize(delta) {
    currentFontSize = Math.min(26, Math.max(10, currentFontSize + delta));
    if (editor) {
      editor.updateOptions({ fontSize: currentFontSize });
    }
    codeFallback.style.fontSize = `${currentFontSize}px`;
    terminal.style.fontSize = `${currentFontSize - 1}px`;
  }

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('c_compiler_theme', theme);

    const darkIcon = document.querySelector('.theme-icon-dark');
    const lightIcon = document.querySelector('.theme-icon-light');
    if (darkIcon && lightIcon) {
      darkIcon.style.display = theme === 'dark' ? 'inline' : 'none';
      lightIcon.style.display = theme === 'light' ? 'inline' : 'none';
    }

    if (editor && window.monaco) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '40px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1e293b';
    toast.style.color = '#f8fafc';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '12px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }

  async function fetchCompilerStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.compiler) {
        setStatus('ready', `Compiler Ready (${data.compiler})`);
      }
    } catch (e) {
      console.warn('Could not fetch compiler info');
    }
  }

  function initSplitter() {
    let isDragging = false;

    splitter.addEventListener('mousedown', (e) => {
      isDragging = true;
      splitter.classList.add('active');
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerWidth = document.getElementById('workspace').clientWidth;
      const leftWidth = e.clientX;
      const percentage = (leftWidth / containerWidth) * 100;

      if (percentage > 20 && percentage < 80) {
        editorPane.style.flex = `0 0 ${percentage}%`;
        outputPane.style.flex = `0 0 ${100 - percentage}%`;
        if (editor) editor.layout();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        splitter.classList.remove('active');
        document.body.style.cursor = 'default';
        if (editor) editor.layout();
      }
    });

    // Window Resize Handler for responsive layout
    window.addEventListener('resize', () => {
      if (editor) {
        editor.layout();
      }
    });
  }

  function formatCodeOutput(code, rawOutput, stdin) {
    if (!rawOutput || !stdin || typeof stdin !== 'string' || !stdin.trim()) {
      return rawOutput || '';
    }

    // 1. Extract prompts from code: printf/puts before scanf/getchar/fgets/getc
    const prompts = [];
    const regex = /(?:printf|puts|fputs)\s*\(\s*"([^"]+)"(?:(?!printf|puts|fputs)[\s\S])*?(?:scanf|getchar|fgets|fgetc|getc)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const promptStr = match[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      prompts.push(promptStr);
    }

    if (prompts.length === 0) {
      return rawOutput;
    }

    // 2. Tokenize stdin into lines and whitespace tokens
    const lines = stdin.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return rawOutput;

    const tokens = [];
    for (const line of lines) {
      tokens.push(...line.split(/\s+/).filter(Boolean));
    }

    const useTokens = (prompts.length > lines.length && prompts.length <= tokens.length);
    const inputs = useTokens ? tokens : lines;

    let formatted = rawOutput;
    let searchStart = 0;
    let inputIdx = 0;

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const pos = formatted.indexOf(prompt, searchStart);
      if (pos !== -1 && inputIdx < inputs.length) {
        const val = inputs[inputIdx++];
        const afterPos = pos + prompt.length;
        formatted = formatted.slice(0, afterPos) + val + '\n' + formatted.slice(afterPos);
        searchStart = afterPos + val.length + 1;
      }
    }

    return formatted;
  }

  function getInteractivePrompts(code) {
    const prompts = [];
    const regex = /(?:printf|puts|fputs)\s*\(\s*"([^"]+)"(?:(?!printf|puts|fputs)[\s\S])*?(?:scanf|getchar|fgets|fgetc|getc)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const raw = match[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      prompts.push(raw);
    }
    if (prompts.length === 0 && /\b(scanf|getchar|fgets)\s*\(/.test(code)) {
      prompts.push('Enter input: ');
    }
    return prompts;
  }

  function stripEchoedPrompts(prompts, text) {
    let result = text || '';
    for (const prompt of prompts) {
      const idx = result.indexOf(prompt);
      if (idx !== -1) {
        result = result.slice(0, idx) + result.slice(idx + prompt.length);
      }
    }
    return result;
  }
})();
