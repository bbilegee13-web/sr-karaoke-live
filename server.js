
const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DB_PATH || path.join(__dirname, 'data', 'karaoke.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';
const USERS = {
  [process.env.ADMIN_USER || 'admin']: { password: process.env.ADMIN_PASS || 'admin123', role: 'admin' },
  [process.env.WORKER_USER || 'worker']: { password: process.env.WORKER_PASS || '1234', role: 'worker' },
};

const sessions = new Map();

function ensureDataFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ sessions: {}, history: [], customMenu: [] }, null, 2), 'utf8');
  }
}

function readState() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { sessions: {}, history: [], customMenu: [] };
  }
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function sign(token) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
}

function makeCookie(res, token) {
  res.cookie('srk_session', `${token}.${sign(token)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function getUserFromReq(req) {
  const raw = req.cookies.srk_session;
  if (!raw) return null;
  const [token, sig] = raw.split('.');
  if (!token || !sig || sign(token) !== sig) return null;
  return sessions.get(token) || null;
}

function authRequired(req, res, next) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  req.user = user;
  next();
}

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const record = USERS[(username || '').toLowerCase()];
  if (!record || record.password !== password) {
    return res.status(401).json({ error: 'Нэр эсвэл нууц үг буруу байна' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  const user = { username: (username || '').toLowerCase(), role: record.role };
  sessions.set(token, user);
  makeCookie(res, token);
  res.json({ ok: true, user });
});

app.post('/api/logout', (req, res) => {
  const raw = req.cookies.srk_session;
  if (raw) {
    const [token] = raw.split('.');
    sessions.delete(token);
  }
  res.clearCookie('srk_session');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user });
});

app.get('/api/state', authRequired, (req, res) => {
  res.json(readState());
});

app.post('/api/state', authRequired, (req, res) => {
  const body = req.body || {};
  const nextState = {
    sessions: body.sessions || {},
    history: Array.isArray(body.history) ? body.history : [],
    customMenu: Array.isArray(body.customMenu) ? body.customMenu : [],
    updatedAt: Date.now(),
    updatedBy: req.user.username,
  };
  writeState(nextState);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`SR Karaoke Live ажиллаж байна: http://localhost:${PORT}`);
  console.log(`State file: ${DATA_FILE}`);
});
