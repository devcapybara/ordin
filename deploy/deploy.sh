#!/usr/bin/env bash
set -e

DOMAIN="ordin.id"
APP_NAME="ordin-app"
IMAGE_NAME="ordin-app:latest"
SERVER_PORT="5000"

docker ps --filter "publish=80" -q | xargs -r docker stop

docker build -t "$IMAGE_NAME" .
docker rm -f "$APP_NAME" 2>/dev/null || true
docker run -d --name "$APP_NAME" -p "$SERVER_PORT:$SERVER_PORT" --restart unless-stopped "$IMAGE_NAME"

sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

sudo mkdir -p /var/www/certbot
sudo chown www-data:www-data /var/www/certbot

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  sudo cp ./deploy/nginx.conf /etc/nginx/sites-available/"$DOMAIN".conf
  sudo ln -sf /etc/nginx/sites-available/"$DOMAIN".conf /etc/nginx/sites-enabled/"$DOMAIN".conf
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
  sudo certbot renew --quiet || true
else
  sudo cp ./deploy/nginx.http.conf /etc/nginx/sites-available/"$DOMAIN".conf
  sudo ln -sf /etc/nginx/sites-available/"$DOMAIN".conf /etc/nginx/sites-enabled/"$DOMAIN".conf
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
  sudo certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -d "www.$DOMAIN" --agree-tos -m "admin@$DOMAIN" -n
  sudo cp ./deploy/nginx.conf /etc/nginx/sites-available/"$DOMAIN".conf
  sudo ln -sf /etc/nginx/sites-available/"$DOMAIN".conf /etc/nginx/sites-enabled/"$DOMAIN".conf
  sudo nginx -t
  sudo systemctl reload nginx
fi

sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo systemctl status nginx >/dev/null
