
# SR Karaoke Live

Энэ багц нь таны явуулсан HTML код дээр суурилж live website болгоход зориулж зассан хувилбар.

## Юу өөрчилсөн бэ?
- `localStorage` хадгалалтыг серверийн файл хадгалалт болгосон
- login-г backend API-р шалгадаг болгосон
- олон төхөөрөмжөөс ижил өгөгдөл харах боломжтой болгосон

## Local ажиллуулах
```bash
npm install
npm start
```

Дараа нь `http://localhost:3000`

## Environment variables
```bash
PORT=3000
DB_PATH=./data/karaoke.json
SESSION_SECRET=strong_secret_here
ADMIN_USER=admin
ADMIN_PASS=admin123
WORKER_USER=worker
WORKER_PASS=1234
```

## Render
- Build Command: `npm install`
- Start Command: `npm start`
- Persistent Disk Mount Path: `/var/data`
- `DB_PATH=/var/data/karaoke.json`
