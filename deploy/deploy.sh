#!/usr/bin/env bash
#
# Deploy the latest code. Run on the server after pushing to GitHub:
#   /var/www/portfolio/deploy/deploy.sh
#
# Pass --no-pull to rebuild without fetching (used by setup-server.sh).

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${BRANCH:-main}"
cd "${APP_DIR}"

echo "==> Deploying ${APP_DIR}"

if [ "${1:-}" != "--no-pull" ]; then
    php artisan down --retry=15 --quiet || true
    trap 'php artisan up --quiet' EXIT
    git fetch --quiet origin "${BRANCH}"
    git reset --quiet --hard "origin/${BRANCH}"
    echo "    ✓ Code updated to $(git log -1 --format='%h %s')"
fi

composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --quiet
echo "    ✓ PHP dependencies"

npm ci --no-audit --no-fund --loglevel=error
npm run build --silent >/dev/null
echo "    ✓ Frontend built"

# SQLite database lives in database/ - make sure it exists before migrating.
[ -f database/database.sqlite ] || touch database/database.sqlite
php artisan migrate --force --quiet
echo "    ✓ Database migrated"

php artisan optimize:clear --quiet
php artisan optimize --quiet
echo "    ✓ Caches rebuilt"

# The web server (www-data) needs to write logs, cache, sessions and the database.
sudo chgrp -R www-data storage bootstrap/cache database
sudo chmod -R ug+rwX storage bootstrap/cache database

echo "==> Deployed"
