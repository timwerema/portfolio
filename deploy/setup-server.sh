#!/usr/bin/env bash
#
# One-time server setup for the portfolio (Debian 12 / Ubuntu 22.04+ / 24.04).
#
# Installs Nginx, PHP, Composer, Node.js, a firewall and HTTPS, then deploys
# the site from GitHub. Safe to re-run: steps that are already done are skipped.
#
# Usage (as a normal user with sudo, NOT as root):
#   curl -fsSLO https://raw.githubusercontent.com/timwerema/portfolio/main/deploy/setup-server.sh
#   DOMAIN=timasiwerema.com CERTBOT_EMAIL=you@example.com bash setup-server.sh
#
# Optional variables:
#   DOMAIN          Your domain, e.g. timasiwerema.com. Leave empty to serve on
#                   the server's IP address over plain HTTP (no HTTPS).
#   CERTBOT_EMAIL   Email for Let's Encrypt expiry notices (needed for HTTPS).
#   RESEND_API_KEY  Resend API key (re_...) so the contact form sends email.
#   REPO            Git URL (default: https://github.com/timwerema/portfolio.git)
#   BRANCH          Branch to deploy (default: main)
#   APP_DIR         Install path (default: /var/www/portfolio)
#   SKIP_FIREWALL   Set to 1 to leave the firewall alone (e.g. on a shared/test VM).

set -euo pipefail

DOMAIN="${DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
REPO="${REPO:-https://github.com/timwerema/portfolio.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/portfolio}"
SKIP_FIREWALL="${SKIP_FIREWALL:-0}"
NODE_MAJOR=22

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[0;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[0;33m    ! %s\033[0m\n' "$*"; }
die()  { printf '\033[0;31m    ✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
step "Checking this machine"
[ "$(id -u)" -ne 0 ] || die "Run this as your normal user (with sudo rights), not as root."
sudo -v || die "You need sudo rights. Ask your server admin, or use a VPS where you have them."
. /etc/os-release
case "${ID}" in debian|ubuntu) ok "${PRETTY_NAME}" ;; *) die "Unsupported OS: ${PRETTY_NAME} (needs Debian or Ubuntu)" ;; esac
DEPLOY_USER="$(id -un)"
ok "Deploying as ${DEPLOY_USER} to ${APP_DIR}"

# ---------------------------------------------------------------------------
step "Installing system packages (Nginx, PHP, Git, Certbot)"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y -qq \
    nginx git curl unzip ca-certificates gnupg sqlite3 ufw \
    certbot python3-certbot-nginx \
    php-fpm php-cli php-sqlite3 php-mbstring php-xml php-curl php-zip php-bcmath php-intl >/dev/null
PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
php -r 'exit(version_compare(PHP_VERSION, "8.2.0", ">=") ? 0 : 1);' || die "PHP ${PHP_VERSION} is too old; Laravel 12 needs 8.2+."
PHP_FPM_SOCK="/run/php/php${PHP_VERSION}-fpm.sock"
ok "PHP ${PHP_VERSION}"

# ---------------------------------------------------------------------------
step "Installing Composer"
if ! command -v composer >/dev/null; then
    EXPECTED="$(curl -fsSL https://composer.github.io/installer.sig)"
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    ACTUAL="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
    [ "${EXPECTED}" = "${ACTUAL}" ] || die "Composer installer checksum mismatch"
    sudo php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
    rm -f /tmp/composer-setup.php
fi
ok "$(composer --version 2>/dev/null | head -1)"

# ---------------------------------------------------------------------------
step "Installing Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
    sudo install -d -m 0755 /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
        | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    sudo apt-get update -qq && sudo apt-get install -y -qq nodejs >/dev/null
fi
ok "Node $(node -v)"

# ---------------------------------------------------------------------------
step "Getting the code"
sudo mkdir -p "$(dirname "${APP_DIR}")"
if [ -d "${APP_DIR}/.git" ]; then
    ok "Already cloned, pulling latest"
    git -C "${APP_DIR}" fetch --quiet origin "${BRANCH}"
    git -C "${APP_DIR}" reset --quiet --hard "origin/${BRANCH}"
else
    sudo git clone --quiet --branch "${BRANCH}" "${REPO}" "${APP_DIR}"
    sudo chown -R "${DEPLOY_USER}:www-data" "${APP_DIR}"
fi
cd "${APP_DIR}"

# ---------------------------------------------------------------------------
step "Configuring the app (.env)"
if [ ! -f .env ]; then
    cp .env.example .env
    ok "Created .env from .env.example"
fi

APP_URL="http://$(curl -fsS4 --max-time 5 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
[ -n "${DOMAIN}" ] && APP_URL="https://${DOMAIN}"

set_env() { # set_env KEY VALUE  - replaces or appends a line in .env
    local key="$1" value="$2"
    if grep -qE "^#?\s*${key}=" .env; then
        sed -i -E "s|^#?\s*${key}=.*|${key}=${value}|" .env
    else
        printf '%s=%s\n' "${key}" "${value}" >> .env
    fi
}
# Generate the encryption key without artisan (dependencies aren't installed yet).
grep -qE '^APP_KEY=base64:' .env || set_env APP_KEY "base64:$(php -r 'echo base64_encode(random_bytes(32));')"
set_env APP_ENV production
set_env APP_DEBUG false
set_env APP_URL "${APP_URL}"
set_env LOG_LEVEL warning
set_env DB_CONNECTION sqlite
set_env SESSION_SECURE_COOKIE "$([ -n "${DOMAIN}" ] && echo true || echo false)"

if [ -n "${RESEND_API_KEY}" ]; then
    set_env MAIL_MAILER smtp
    set_env MAIL_HOST smtp.resend.com
    set_env MAIL_PORT 587
    set_env MAIL_USERNAME resend
    set_env MAIL_PASSWORD "${RESEND_API_KEY}"
    set_env MAIL_ENCRYPTION tls
    # Until your domain is verified in Resend, you can only send FROM this test address
    # (and only TO the email your Resend account uses). Change it after verifying.
    grep -qE '^MAIL_FROM_ADDRESS="?hello@example.com' .env && set_env MAIL_FROM_ADDRESS '"onboarding@resend.dev"'
    ok "Email via Resend configured"
else
    warn "No RESEND_API_KEY given: contact-form emails will only be logged (messages still appear in /dashboard)."
fi
ok "APP_URL=${APP_URL}"

# ---------------------------------------------------------------------------
step "Installing dependencies and building"
"${APP_DIR}/deploy/deploy.sh" --no-pull

# ---------------------------------------------------------------------------
step "Configuring Nginx"
SERVER_NAME="${DOMAIN:-_}"
[ -n "${DOMAIN}" ] && SERVER_NAME="${DOMAIN} www.${DOMAIN}"
sudo tee /etc/nginx/sites-available/portfolio >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};
    root ${APP_DIR}/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.php;
    charset utf-8;
    client_max_body_size 10M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    error_page 404 /index.php;

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:${PHP_FPM_SOCK};
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t -q
sudo systemctl enable --now nginx "php${PHP_VERSION}-fpm" >/dev/null 2>&1
sudo systemctl reload nginx
ok "Nginx serving ${APP_DIR}/public"

# ---------------------------------------------------------------------------
step "Firewall"
if [ "${SKIP_FIREWALL}" = "1" ]; then
    warn "Skipped (SKIP_FIREWALL=1)"
else
    sudo ufw allow OpenSSH >/dev/null
    sudo ufw allow 'Nginx Full' >/dev/null
    sudo ufw --force enable >/dev/null
    ok "Allowing SSH, HTTP and HTTPS only"
fi

# ---------------------------------------------------------------------------
step "Scheduler (nightly backups)"
CRON_LINE="* * * * * cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1"
if crontab -l 2>/dev/null | grep -qF "${APP_DIR} && php artisan schedule:run"; then
    ok "Already installed"
else
    ( crontab -l 2>/dev/null; echo "${CRON_LINE}" ) | crontab -
    ok "Installed - backups run nightly at 3:10am into ${APP_DIR}/storage/backups (14 days kept)"
fi

# ---------------------------------------------------------------------------
step "HTTPS certificate"
if [ -z "${DOMAIN}" ]; then
    warn "No DOMAIN set: skipping HTTPS. Re-run with DOMAIN=... once your domain points here."
elif [ -z "${CERTBOT_EMAIL}" ]; then
    warn "No CERTBOT_EMAIL set: skipping HTTPS. Re-run with CERTBOT_EMAIL=you@example.com."
else
    SERVER_IP="$(curl -fsS4 --max-time 5 https://ifconfig.me || true)"
    DNS_IP="$(getent ahostsv4 "${DOMAIN}" | awk 'NR==1{print $1}' || true)"
    if [ -n "${SERVER_IP}" ] && [ "${SERVER_IP}" != "${DNS_IP}" ]; then
        warn "${DOMAIN} points to '${DNS_IP:-nothing}', but this server is ${SERVER_IP}."
        warn "Fix the DNS A record, wait a few minutes, then re-run this script."
    else
        CERT_DOMAINS=(-d "${DOMAIN}")
        if [ "$(getent ahostsv4 "www.${DOMAIN}" | awk 'NR==1{print $1}' || true)" = "${SERVER_IP}" ]; then
            CERT_DOMAINS+=(-d "www.${DOMAIN}")
        else
            warn "www.${DOMAIN} doesn't point here yet; getting a certificate for ${DOMAIN} only."
        fi
        sudo certbot --nginx --non-interactive --agree-tos --redirect -m "${CERTBOT_EMAIL}" "${CERT_DOMAINS[@]}"
        ok "HTTPS enabled; certificates renew automatically"
    fi
fi

# ---------------------------------------------------------------------------
step "Done"
echo "    Site:       ${APP_URL}"
echo "    Next steps:"
echo "      1. Create your admin login:   cd ${APP_DIR} && php artisan user:create"
echo "      2. Read messages at:          ${APP_URL}/dashboard"
echo "      3. Deploy future updates:     ${APP_DIR}/deploy/deploy.sh"
echo "      4. Back up right now:         cd ${APP_DIR} && php artisan backup:run"
