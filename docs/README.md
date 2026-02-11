# Palmiye Futbol - Teknik Dokumantasyon

Bu dokuman uygulamanin calisma sekli, gereksinimleri ve gelistirme/deploy adimlarini ozetler.

## Gereksinimler
- Node.js 20+
- npm 9+

## Proje Yapisi (Ozet)
- app/: Next.js App Router sayfalari ve API route handler'lari
- lib/db/sqlite.ts: SQLite veritabani katmani
- data/: SQLite veritabani dosyasi (football.db)
- scripts/: yedekleme/geri yukleme scriptleri

## Veritabani
Uygulama SQLite kullanir. Veritabani dosyasi `data/football.db` yolunda tutulur.
Docker ile calistirildiginda bu klasor host makineden volume ile baglanir.

Yedekleme ve geri yukleme:
- `sh scripts/db-backup.sh`
- `sh scripts/db-restore.sh /path/to/football-db-YYYYMMDD-HHMMSS.tar.gz`

## Calistirma
Gelistirme:
- `npm install`
- `npm run dev`

Prod build:
- `npm run build`
- `npm start`

Docker:
- `docker compose up --build -d`

## API Rotalari
API, `app/api` altinda Next.js route handler'lari ile sunulur:
- `/api/players`
- `/api/matches`
- `/api/goals`
- `/api/stats`
- `/api/settings`
- `/api/auth/*`

## Sayfalar
- `/` Ana saha ekrani
- `/admin` Admin paneli
- `/stats` Maclar ve istatistikler
- `/share` Paylasim gorunumu

## Notlar
- Gol suresi `ss`, `mm:ss` veya `hh:mm:ss` formatinda girilebilir.
- Admin kullanicilar mac/gol duzenleyebilir ve golleri onaylayabilir.
- Admin olmayan kullanicilar gol ekleyebilir, onay admin tarafindan yapilir.
