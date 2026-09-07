/**
 * Mock third-party lead receiver for testing API push mode.
 * Run: node mock-third-party/server.js
 * Or: docker compose --profile demo up
 */
const http = require('http');

const PORT = Number(process.env.PORT) || 4782;
const received = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', received_count: received.length }));
    return;
  }

  if (req.method === 'GET' && req.url === '/leads') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(received));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/leads') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const record = {
          ...payload,
          third_lead_id: `mock_${Date.now()}`,
          received_at: new Date().toISOString(),
        };
        received.unshift(record);
        console.log('[mock-third-party] received lead:', record.lead_id, record.mobile);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            third_lead_id: record.third_lead_id,
            message: 'Lead received',
          }),
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Mock third-party listening on http://localhost:${PORT}`);
  console.log(`POST leads to: http://localhost:${PORT}/api/leads`);
  console.log(`View received: http://localhost:${PORT}/leads`);
});
