const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss  = new WebSocket.Server({ port: PORT });

console.log(`JBA Tracker Backend running on port ${PORT}`);

wss.on('connection', (socket, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[+] Client connected from ${ip} | Total: ${wss.clients.size}`);

  socket.on('message', (data) => {
    const raw = data.toString();

    // Rebroadcast para todos os outros clientes
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });

    // ACK de volta ao remetente
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ack', msg: 'received', ts: new Date().toISOString() }));
    }

    // Log resumido
    try {
      const d = JSON.parse(raw);
      if (d.type === 'location') {
        console.log(`[GPS] ${d.inspectorName || d.inspectorId} → ${d.lat?.toFixed(5)}, ${d.lng?.toFixed(5)}`);
      }
    } catch {}
  });

  socket.on('close', () => {
    console.log(`[-] Client disconnected | Total: ${wss.clients.size}`);
  });

  socket.on('error', (err) => {
    console.error(`[!] Socket error: ${err.message}`);
  });
});
