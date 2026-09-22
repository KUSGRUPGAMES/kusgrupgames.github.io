#!/usr/bin/env bash
# Şartname §71, §86 — veritabanı şeması ve RLS doğrulaması.
#
# Geçici bir PostgreSQL kümesi kurar, migration'ları uygular, RLS davranış
# sınamalarını çalıştırır ve kümeyi kapatır. Supabase'in `auth` şeması
# tests/00_auth_stub.sql ile taklit edilir; o dosya üretime gönderilmez.
#
# Kullanım:  bash tools/verify-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPA="$ROOT/supabase"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PGUSER_SYS="${PGUSER_SYS:-postgres}"

if [ ! -x "$PGBIN/initdb" ]; then
  echo "ATLANDI: PostgreSQL sunucusu bulunamadı ($PGBIN/initdb)."
  echo "         Kurmak için: apt-get install -y postgresql-16 postgresql-16-pgvector"
  exit 0
fi

# Boş bir port seç — sabit port başka bir sunucu tarafından tutulmuş olabilir.
# (Bu tuzağa film.sh'de bir kez düşüldü: sabit port bayat sunucuya çarpmıştı.)
PORT="$(python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()")"
PGDATA="$(mktemp -d /var/lib/postgresql/bes-verify-XXXXXX)"
SOCK="$(mktemp -d)"
chown "$PGUSER_SYS":"$PGUSER_SYS" "$PGDATA" "$SOCK"
chmod 700 "$PGDATA"

temizle() {
  su "$PGUSER_SYS" -c "$PGBIN/pg_ctl -D $PGDATA -m immediate stop" >/dev/null 2>&1 || true
  find "$PGDATA" -mindepth 1 -delete 2>/dev/null || true
  rmdir "$PGDATA" 2>/dev/null || true
  find "$SOCK" -mindepth 1 -delete 2>/dev/null || true
  rmdir "$SOCK" 2>/dev/null || true
}
trap temizle EXIT

su "$PGUSER_SYS" -c "$PGBIN/initdb -D $PGDATA -A trust -U postgres" >/dev/null
su "$PGUSER_SYS" -c "$PGBIN/pg_ctl -D $PGDATA -o '-p $PORT -k $SOCK' -l $PGDATA/server.log start" >/dev/null

export PGOPTIONS='--client-min-messages=warning'
PSQL=(psql -h "$SOCK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -d postgres -c "create database bes_test;" >/dev/null
"${PSQL[@]}" -d bes_test -c "create extension if not exists pgcrypto;" >/dev/null
"${PSQL[@]}" -d bes_test -f "$SUPA/tests/00_auth_stub.sql" >/dev/null

for f in "$SUPA"/migrations/*.sql; do
  printf '  migration %s\n' "$(basename "$f")"
  "${PSQL[@]}" -d bes_test -f "$f" >/dev/null
done

echo "  RLS sınaması"
"${PSQL[@]}" -d bes_test -f "$SUPA/tests/01_rls_test.sql"

# Kapsama kontrolü: politikasız RLS tablosu ya da RLS'siz tablo kalmasın (§71).
echo "  kapsama kontrolü"
"${PSQL[@]}" -d bes_test -f "$SUPA/tests/02_rls_coverage.sql"

echo "VERITABANI DOGRULAMASI GECTI"
