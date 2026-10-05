#!/bin/sh
set -e

# Initialize Postgres if data directory is empty
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Initializing database..."
    initdb -D "$PGDATA"
    
    # Start temporary postgres to create user and database
    pg_ctl -D "$PGDATA" -o "-c listen_addresses=''" -w start
    
    psql --command "CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';"
    createdb -O postgres offlinebizfinder
    
    pg_ctl -D "$PGDATA" -m fast -w stop
fi

echo "Starting PostgreSQL..."
exec postgres -D "$PGDATA" -c listen_addresses='localhost'
