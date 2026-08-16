const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];

  // Route root to preview.html
  if (reqUrl === '/' || reqUrl === '/index.html') {
    reqUrl = '/preview.html';
  }

  // Handle mock cart API requests
  if (reqUrl === '/cart.js') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      item_count: 1,
      total_price: 3499,
      items: [
        {
          id: 1,
          title: 'Ironivo Finger & Hand Grip Pro',
          quantity: 1,
          price: 3499,
          featured_image: { url: '/assets/product-hero.jpg' }
        }
      ]
    }));
    return;
  }

  if (reqUrl === '/cart/add.js') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 1,
      title: 'Ironivo Finger & Hand Grip Pro',
      quantity: 1,
      price: 3499
    }));
    return;
  }

  // File resolution
  let filePath = path.join(__dirname, reqUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Ironivo Theme Preview Server running at: http://localhost:${PORT}\n`);
});
