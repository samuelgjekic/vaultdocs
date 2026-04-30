#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate --force
fi

# Ensure SQLite file exists (when using a fresh volume)
mkdir -p "$(dirname "${DB_DATABASE:-database/database.sqlite}")"
touch "${DB_DATABASE:-database/database.sqlite}"

php artisan config:cache
php artisan route:cache
php artisan migrate --force

if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  php artisan db:seed --force
fi

exec php artisan serve --host=0.0.0.0 --port=8000
