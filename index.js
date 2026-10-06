const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Pre-read static assets for high-performance memory fallback
const rootDir = __dirname;
let cachedIndexHtml = '';
let cachedStyleCss = '';
let cachedScriptJs = '';

try {
  cachedIndexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
} catch (e) {
  try { cachedIndexHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8'); } catch (e2) {}
}

try {
  cachedStyleCss = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf8');
} catch (e) {
  try { cachedStyleCss = fs.readFileSync(path.join(rootDir, 'public', 'style.css'), 'utf8'); } catch (e2) {}
}

try {
  cachedScriptJs = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
} catch (e) {
  try { cachedScriptJs = fs.readFileSync(path.join(rootDir, 'public', 'script.js'), 'utf8'); } catch (e2) {}
}

// Serve static assets from public/ and root directory
app.use(express.static(path.join(rootDir, 'public')));
app.use(express.static(rootDir));

// API Handlers
const runHandler = require('./api/run.js');
const statusHandler = require('./api/status.js');

app.all('/api/run', (req, res) => runHandler(req, res));
app.all('/api/status', (req, res) => statusHandler(req, res));

// Direct asset routes with fallback
app.get('/style.css', (req, res) => {
  res.type('text/css');
  const filePath = path.join(rootDir, 'style.css');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.send(cachedStyleCss);
});

app.get(['/script.js', '/app.js'], (req, res) => {
  res.type('application/javascript');
  const filePath = path.join(rootDir, 'script.js');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.send(cachedScriptJs);
});

// Root & wildcard routes
app.get(['/', '/index.html'], (req, res) => {
  res.type('text/html');
  const filePath = path.join(rootDir, 'index.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.send(cachedIndexHtml);
});

app.get('*', (req, res) => {
  res.type('text/html');
  const filePath = path.join(rootDir, 'index.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.send(cachedIndexHtml);
});

// Start server if run directly (node index.js)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
