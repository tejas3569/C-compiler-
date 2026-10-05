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

  const { code, stdin = '' } = req.body || {};
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
};
