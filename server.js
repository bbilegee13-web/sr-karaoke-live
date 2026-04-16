import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const WORKER_PASSWORD = process.env.WORKER_PASSWORD || "1234";

const db = new Database(path.join(__dirname, "data.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id=1),
  sessions_json TEXT NOT NULL DEFAULT '{}',
  history_json TEXT NOT NULL DEFAULT '[]',
  custom_menu_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','worker'))
);
`);

function upsertUser(username, password, role) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO users(username,password_hash,role) VALUES(?,?,?)
    ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash, role=excluded.role`).run(username, hash, role);
}
upsertUser('admin', ADMIN_PASSWORD, 'admin');
upsertUser('worker', WORKER_PASSWORD, 'worker');
db.prepare(`INSERT OR IGNORE INTO app_state(id) VALUES(1)`).run();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token хүчингүй байна' });
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT username,password_hash,role FROM users WHERE username=?').get((username || '').toLowerCase());
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ error: 'Нэр эсвэл нууц үг буруу байна' });
  }
  const token = jwt.sign({ username: row.username, role: row.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ username: row.username, role: row.role, token });
});

app.get('/api/state', auth, (req, res) => {
  const row = db.prepare('SELECT sessions_json,history_json,custom_menu_json,updated_at,updated_by FROM app_state WHERE id=1').get();
  res.json({
    sessions: JSON.parse(row.sessions_json || '{}'),
    history: JSON.parse(row.history_json || '[]'),
    customMenu: JSON.parse(row.custom_menu_json || '[]'),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  });
});

app.post('/api/state', auth, (req, res) => {
  const { sessions = {}, history = [], customMenu = [] } = req.body || {};
  db.prepare(`UPDATE app_state SET sessions_json=?, history_json=?, custom_menu_json=?, updated_at=CURRENT_TIMESTAMP, updated_by=? WHERE id=1`)
    .run(JSON.stringify(sessions), JSON.stringify(history), JSON.stringify(customMenu), req.user.username);
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`SR Karaoke ready on http://localhost:${PORT}`));
