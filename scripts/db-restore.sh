#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"

ARCHIVE="$1"
if [ -z "$ARCHIVE" ]; then
  echo "Kullanım: scripts/db-restore.sh /path/to/football-db-YYYYMMDD-HHMMSS.tar.gz"
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Arşiv bulunamadı: $ARCHIVE"
  exit 1
fi

mkdir -p "$DATA_DIR"

tar -xzf "$ARCHIVE" -C "$DATA_DIR"
echo "Geri yükleme tamamlandı: $DATA_DIR/football.db"
