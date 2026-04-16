# SR Karaoke Ready

Энэ багц нь таны HTML кодыг олон төхөөрөмжөөс зэрэг ашиглах боломжтой сервертэй хувилбар болгосон.

## Юу орсон бэ
- `public/index.html` — таны UI, cloud sync-тэй болгосон
- `public/config.js` — API base тохиргоо
- `server.js` — Express + SQLite backend
- `package.json` — суулгах dependency

## Шууд асаах
```bash
npm install
npm start
```
Дараа нь `http://localhost:3000`

## Login
- admin / admin123
- worker / 1234

## Чухал
Production дээр эдгээр default нууц үгийг заавал солино:
```bash
JWT_SECRET=your-secret
ADMIN_PASSWORD=strong-admin-pass
WORKER_PASSWORD=strong-worker-pass
```

## Render / VPS deploy
1. Repo upload хийнэ
2. Build command: `npm install`
3. Start command: `npm start`
4. Environment variables дээр дээрх 3 утгыг тохируулна
5. `data.sqlite` файлыг persistent disk дээр хадгална

## Анхаарах зүйл
- Энэ хувилбар нь жижиг бизнесэд боломжийн
- State-г бүхэлд нь sync хийдэг тул маш олон хэрэглэгчтэй enterprise түвшний архитектур биш
- Гэхдээ касс + owner + worker зэрэг 2-5 төхөөрөмжийн хувьд practical
