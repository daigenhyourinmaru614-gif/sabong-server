// Sabong Arena relay server
// - Serves the game at "/"  (so you can just open your server's URL and play)
// - Relays trade/duel messages between the 2 players in a room at "/ws?room=CODE"
// - GET /health for uptime monitors (keeps free hosts awake)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const GAME_FILE = [path.join(__dirname, 'public', 'index.html'), path.join(__dirname, 'index.html')].find(f => fs.existsSync(f)) || path.join(__dirname, 'index.html');
const MAX_PLAYERS_PER_ROOM = 2;
const MAX_MSG_BYTES = 256 * 1024;      // a bird is a few KB; this is generous
const MAX_MSGS_PER_SEC = 60;           // flood protection

const rooms = new Map();               // code -> Set<ws>
const started = Date.now();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size, uptime: Math.round((Date.now() - started) / 1000) }));
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    fs.readFile(GAME_FILE, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Game file missing (public/index.html)'); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
    return;
  }
  res.writeHead(405); res.end();
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MSG_BYTES });

const send = (ws, obj) => { if (ws.readyState === 1) ws.send('#' + JSON.stringify(obj)); };
function announce(code) {
  const set = rooms.get(code); if (!set) return;
  for (const p of set) send(p, { k: 'peers', n: set.size });
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const code = String(url.searchParams.get('room') || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
  if (code.length < 4) { ws.close(1008, 'bad room'); return; }

  let set = rooms.get(code);
  if (!set) { set = new Set(); rooms.set(code, set); }
  if (set.size >= MAX_PLAYERS_PER_ROOM) { send(ws, { k: 'full' }); ws.close(1008, 'room full'); return; }
  set.add(ws);

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  let winStart = Date.now(), winCount = 0;

  announce(code);

  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    const now = Date.now();
    if (now - winStart > 1000) { winStart = now; winCount = 0; }
    if (++winCount > MAX_MSGS_PER_SEC) { ws.close(1008, 'too fast'); return; }
    const text = data.toString();
    if (text[0] === '#') return;                       // '#' is reserved for server messages
    for (const p of set) if (p !== ws && p.readyState === 1) p.send(text);
  });

  ws.on('close', () => {
    set.delete(ws);
    if (set.size === 0) rooms.delete(code); else announce(code);
  });
  ws.on('error', () => {});
});

// heartbeat: drops dead connections and keeps proxies from timing out idle sockets
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 25000);

server.listen(PORT, () => console.log('Sabong Arena server listening on :' + PORT));
