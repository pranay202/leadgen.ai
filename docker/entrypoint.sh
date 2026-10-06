#!/bin/sh
set -eu

: "${JWT_SECRET:=change-me-in-production}"
: "${GOOGLE_MAPS_API_KEY:=}"
export JWT_SECRET GOOGLE_MAPS_API_KEY

# Supervisor starts Postgres as the postgres user. Wait for it before applying
# Prisma migrations, otherwise a fresh container can race its own database.
/usr/bin/supervisord -c /etc/supervisord.conf &
supervisord_pid=$!

until pg_isready -h 127.0.0.1 -p 5432 -U postgres >/dev/null 2>&1; do
  kill -0 "$supervisord_pid" 2>/dev/null || exit 1
  sleep 1
done

cd /app/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/leadgen?schema=public" npx prisma migrate deploy

supervisorctl start api web nginx
wait "$supervisord_pid"
