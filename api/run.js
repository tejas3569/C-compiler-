const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
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

    const makeRequest = () => new Promise((resolve, reject) => {
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

    let result;
    try {
      result = await makeRequest();
    } catch (firstErr) {
      if (firstErr.message && firstErr.message.includes('Too many requests')) {
        // Wait 1.5s and retry once
        await new Promise(r => setTimeout(r, 1500));
        result = await makeRequest();
      } else {
        throw firstErr;
      }
    }

    const totalTimeMs = Date.now() - compileStart;

    // Check for compilation error
    if (result.status !== '0' && result.compiler_error) {
      return res.json({
        status: 'compile_error',
        compilationError: result.compiler_error || result.compiler_message,
        compileTimeMs: totalTimeMs
      });
    }

    // Execution Success or Runtime Error
    const exitCode = parseInt(result.status || '0', 10);
    const rawOutput = result.program_output || result.program_message || '';
    const output = formatCodeOutput(code, rawOutput, stdin);
    const error = result.program_error || '';

    return res.json({
      status: 'success',
      output: output,
      rawOutput: rawOutput,
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
};

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
      if (formatted.slice(afterPos).trim().startsWith(val)) {
        searchStart = afterPos;
        continue;
      }
      formatted = formatted.slice(0, afterPos) + val + '\n' + formatted.slice(afterPos);
      searchStart = afterPos + val.length + 1;
    }
  }

  return formatted;
}

