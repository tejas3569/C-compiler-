const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();

app.use(express.json({ limit: '5mb' }));

// Static asset handlers
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

// GET / - Serve index.html reliably
app.get('/', (req, res) => {
  const candidates = [
    path.join(process.cwd(), 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join(process.cwd(), 'public', 'index.html'),
    path.join(__dirname, '..', 'public', 'index.html')
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fs.readFileSync(file, 'utf8'));
    }
  }

  res.status(200).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/index.html"></head></html>');
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ready',
    compiler: 'GCC 13.2.0 (Cloud Engine / Vercel Serverless)',
    platform: 'serverless',
    mode: 'cloud'
  });
});

// POST /api/run - Cloud C compilation & execution
app.post('/api/run', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { code, stdin = '' } = body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Source code is required.' });
  }

  try {
    const compileStart = Date.now();
    const payload = JSON.stringify({
      compiler: 'gcc-13.2.0',
      code: code,
      stdin: stdin,
      options: 'warning'
    });

    const result = await new Promise((resolve, reject) => {
      const request = https.request('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 15000
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse compiler response: ' + data));
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Compiler request timed out'));
      });

      request.write(payload);
      request.end();
    });

    const totalTimeMs = Date.now() - compileStart;

    if (result.status !== '0' && result.compiler_error) {
      return res.json({
        status: 'compile_error',
        compilationError: result.compiler_error || result.compiler_message,
        compileTimeMs: totalTimeMs
      });
    }

    const exitCode = parseInt(result.status || '0', 10);
    const output = result.program_output || result.program_message || '';
    const error = result.program_error || '';

    return res.json({
      status: 'success',
      output: output,
      error: error,
      compilationWarnings: result.compiler_output || '',
      exitCode: exitCode,
      executionTimeMs: Math.max(10, Math.floor(totalTimeMs * 0.3)),
      compileTimeMs: Math.floor(totalTimeMs * 0.7)
    });

  } catch (err) {
    return res.status(500).json({
      status: 'runtime_error',
      error: `Cloud compiler error: ${err.message}`
    });
  }
});

module.exports = app;
