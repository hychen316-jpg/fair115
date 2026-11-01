// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'orders.json');

// 初始化根目錄的 orders.json
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  // 1. 首頁靜態檔路由
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }

  // 2. 獲取所有訂單
  if (req.method === 'GET' && req.url === '/api/orders') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(readDB()));
  }

  // 3. 接收新訂單並寫入根目錄 orders.json
  if (req.method === 'POST' && req.url === '/api/orders') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const payload = JSON.parse(body);
      const orders = readDB();
      
      const newOrderNum = String(orders.length + 1).padStart(2, '0');
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newOrder = {
        id: Date.now().toString(),
        orderNumber: newOrderNum,
        items: payload.items,
        total: payload.total,
        status: '製作中',
        time: timeStr
      };

      orders.push(newOrder);
      writeDB(orders); // 寫入同目錄檔案

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newOrder));
    });
    return;
  }

  // 4. 更新訂單狀態
  if (req.method === 'PATCH' && req.url.startsWith('/api/orders/')) {
    const id = req.url.split('/').pop();
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { status } = JSON.parse(body);
      const orders = readDB();
      const order = orders.find(o => o.id === id);
      if (order) order.status = status;
      writeDB(orders);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`園遊會點餐系統已啟動：http://localhost:${PORT}`);
});
