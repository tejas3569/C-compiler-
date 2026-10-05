const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execSync } = require('child_process');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const TEMP_DIR = path.join(__dirname, '.temp_runs');

// Ensure temporary execution directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Find GCC compiler binary
function getGccPath() {
  const customGcc = process.env.GCC_PATH;
  if (customGcc && fs.existsSync(customGcc)) return customGcc;
  
  const commonPaths = [
    'gcc',
    'C:\\MinGW\\bin\\gcc.exe',
    'C:\\msys64\\ucrt64\\bin\\gcc.exe',
    'C:\\msys64\\mingw64\\bin\\gcc.exe'
  ];

  for (const p of commonPaths) {
    try {
      execSync(`"${p}" --version`, { stdio: 'ignore' });
      return p;
    } catch (e) {
      // Continue checking next path
    }
  }
  return 'gcc';
}

const GCC_EXEC = getGccPath();

// Get GCC details
let gccInfo = 'Unknown GCC';
try {
  const versionOutput = execSync(`"${GCC_EXEC}" --version`, { encoding: 'utf8' });
  gccInfo = versionOutput.split('\n')[0].trim();
} catch (err) {
  console.warn('Could not determine GCC version:', err.message);
}

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API: Check system and compiler status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ready',
    compiler: gccInfo,
    path: GCC_EXEC,
    platform: process.platform,
    arch: process.arch
  });
});

// API: Batch Run (REST)
app.post('/api/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Source code is required.' });
  }

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const runDir = path.join(TEMP_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const sourceFile = path.join(runDir, 'main.c');
  const exeFile = path.join(runDir, process.platform === 'win32' ? 'main.exe' : 'main');

  fs.writeFileSync(sourceFile, code, 'utf8');

  // Step 1: Compile
  const compileStart = Date.now();
  const unbufHeader = path.join(__dirname, 'unbuffer.h').replace(/\\/g, '/');
  const compileArgs = ['-Wall', '-Wextra', '-O2', '-D__USE_MINGW_ANSI_STDIO=1'];
  if (fs.existsSync(unbufHeader)) {
    compileArgs.push('-include', unbufHeader);
  }
  compileArgs.push(sourceFile, '-o', exeFile, '-lm');

  const compileProcess = spawn(GCC_EXEC, compileArgs, {
    cwd: runDir
  });

  let compileStderr = '';
  compileProcess.stderr.on('data', (d) => { compileStderr += d.toString(); });

  compileProcess.on('close', (compileCode) => {
    const compileTimeMs = Date.now() - compileStart;

    if (compileCode !== 0) {
      cleanDir(runDir);
      return res.json({
        status: 'compile_error',
        compilationError: compileStderr,
        compileTimeMs
      });
    }

    // Step 2: Execute
    const execStart = Date.now();
    let stdoutData = '';
    let stderrData = '';
    let killedByTimeout = false;

    const child = spawn(exeFile, [], { cwd: runDir });

    const timeoutTimer = setTimeout(() => {
      killedByTimeout = true;
      child.kill('SIGKILL');
    }, 10000); // 10 second timeout

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.stdout.on('data', (d) => {
      stdoutData += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderrData += d.toString();
    });

    child.on('close', (exitCode) => {
      clearTimeout(timeoutTimer);
      const executionTimeMs = Date.now() - execStart;
      cleanDir(runDir);

      if (killedByTimeout) {
        return res.json({
          status: 'timeout',
          output: stdoutData,
          error: 'Execution timed out (10 seconds limit exceeded). Check for infinite loops.',
          executionTimeMs,
          compileTimeMs
        });
      }

      res.json({
        status: 'success',
        output: stdoutData,
        error: stderrData,
        compilationWarnings: compileStderr,
        exitCode: exitCode ?? 0,
        executionTimeMs,
        compileTimeMs
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeoutTimer);
      cleanDir(runDir);
      res.json({
        status: 'runtime_error',
        error: err.message,
        compileTimeMs
      });
    });
  });
});

// Helper to clean temp run directory safely
function cleanDir(dirPath) {
  setTimeout(() => {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (e) {
      // Best effort cleanup on Windows file lock
    }
  }, 500);
}

// WebSocket: Interactive Execution
wss.on('connection', (ws) => {
  let activeProcess = null;
  let runDir = null;
  let timeoutTimer = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'run') {
        if (activeProcess) {
          activeProcess.kill();
        }

        const runId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        runDir = path.join(TEMP_DIR, runId);
        fs.mkdirSync(runDir, { recursive: true });

        const sourceFile = path.join(runDir, 'main.c');
        const exeFile = path.join(runDir, process.platform === 'win32' ? 'main.exe' : 'main');
        fs.writeFileSync(sourceFile, data.code || '', 'utf8');

        ws.send(JSON.stringify({ type: 'status', message: 'Compiling with GCC...' }));
        const compileStart = Date.now();
        const unbufHeader = path.join(__dirname, 'unbuffer.h').replace(/\\/g, '/');
        const compileArgs = ['-Wall', '-Wextra', '-O2', '-D__USE_MINGW_ANSI_STDIO=1'];
        if (fs.existsSync(unbufHeader)) {
          compileArgs.push('-include', unbufHeader);
        }
        compileArgs.push(sourceFile, '-o', exeFile, '-lm');

        const compiler = spawn(GCC_EXEC, compileArgs, {
          cwd: runDir
        });

        let compileErr = '';
        compiler.stderr.on('data', (d) => { compileErr += d.toString(); });

        compiler.on('close', (cCode) => {
          const compTime = Date.now() - compileStart;
          if (cCode !== 0) {
            ws.send(JSON.stringify({
              type: 'compile_error',
              error: compileErr,
              compTime
            }));
            cleanDir(runDir);
            return;
          }

          if (compileErr.trim()) {
            ws.send(JSON.stringify({ type: 'compile_warning', warning: compileErr }));
          }

          ws.send(JSON.stringify({ type: 'status', message: 'Executing program...', compTime }));

          const execStart = Date.now();
          activeProcess = spawn(exeFile, [], { cwd: runDir });

          timeoutTimer = setTimeout(() => {
            if (activeProcess) {
              ws.send(JSON.stringify({ type: 'error', data: '\n[Execution timed out after 20 seconds]\n' }));
              activeProcess.kill('SIGKILL');
            }
          }, 20000);

          activeProcess.stdout.on('data', (d) => {
            ws.send(JSON.stringify({ type: 'stdout', data: d.toString() }));
          });

          activeProcess.stderr.on('data', (d) => {
            ws.send(JSON.stringify({ type: 'stderr', data: d.toString() }));
          });

          activeProcess.on('close', (code) => {
            clearTimeout(timeoutTimer);
            const execTime = Date.now() - execStart;
            ws.send(JSON.stringify({
              type: 'exit',
              exitCode: code ?? 0,
              execTime
            }));
            activeProcess = null;
            cleanDir(runDir);
          });

          activeProcess.on('error', (err) => {
            clearTimeout(timeoutTimer);
            ws.send(JSON.stringify({ type: 'error', data: `Execution failed: ${err.message}\n` }));
            activeProcess = null;
            cleanDir(runDir);
          });
        });
      } else if (data.type === 'stdin') {
        if (activeProcess && activeProcess.stdin && !activeProcess.stdin.destroyed) {
          activeProcess.stdin.write(data.data);
        }
      } else if (data.type === 'stop') {
        if (activeProcess) {
          activeProcess.kill();
          ws.send(JSON.stringify({ type: 'status', message: 'Process stopped by user.' }));
          activeProcess = null;
          cleanDir(runDir);
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', data: `Server error: ${e.message}` }));
    }
  });

  ws.on('close', () => {
    if (activeProcess) {
      activeProcess.kill();
    }
    if (runDir) {
      cleanDir(runDir);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Online C Compiler & Editor running at: http://localhost:${PORT}`);
  console.log(` Compiler Toolchain : ${gccInfo}`);
  console.log(` Compiler Path      : ${GCC_EXEC}`);
  console.log(`=======================================================`);
});
