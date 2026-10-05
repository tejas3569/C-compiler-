module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  res.json({
    status: 'ready',
    compiler: 'GCC 13.2.0 (Cloud Engine / Vercel Serverless)',
    platform: 'serverless',
    mode: 'cloud'
  });
};
