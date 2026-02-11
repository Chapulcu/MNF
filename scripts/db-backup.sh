#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
BACKUP_DIR="$ROOT_DIR/backups"

mkdir -p "$BACKUP_DIR"

TS="$(date +"%Y%m%d-%H%M%S")"
DB_FILE="$DATA_DIR/football.db"

if [ ! -f "$DB_FILE" ]; then
  echo "DB bulunamadı: $DB_FILE"
  exit 1
fi

tar -czf "$BACKUP_DIR/football-db-$TS.tar.gz" -C "$DATA_DIR" football.db
echo "Backup oluşturuldu: $BACKUP_DIR/football-db-$TS.tar.gz"
