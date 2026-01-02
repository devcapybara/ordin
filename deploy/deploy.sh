#!/usr/bin/env bash
set -e

DOMAIN="ordin.id"
APP_NAME="ordin-app"
IMAGE_NAME="ordin-app:latest"
SERVER_PORT="5000"

docker ps --filter "publish=80" -q | xargs -r docker stop
docker ps --filter "publish=5000" -q | xargs -r docker stop
docker rm -f restaurant_app 2>/dev/null || true
if [ -f "./docker-compose.yml" ]; then
  docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
fi

# Ensure app network and Redis
docker network inspect ordin-net >/dev/null 2>&1 || docker network create ordin-net
if ! docker ps --format '{{.Names}}' | grep -q '^ordin-redis$'; then
  docker rm -f ordin-redis 2>/dev/null || true
  docker run -d --name ordin-redis --network ordin-net -p 6379:6379 redis:alpine
fi

docker build -t "$IMAGE_NAME" .
docker rm -f "$APP_NAME" 2>/dev/null || true
ENV_FILE=""
if [ -f "./server/.env" ]; then
  ENV_FILE="./server/.env"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
  for k in MONGODB_URI JWT_SECRET CLIENT_URL; do
    if ! grep -q "^$k=" "$ENV_FILE"; then
      echo "Missing $k in $ENV_FILE"
      exit 1
    fi
  done
fi

if [ -n "$ENV_FILE" ]; then
  docker run -d --name "$APP_NAME" -p "$SERVER_PORT:$SERVER_PORT" --env-file "$ENV_FILE" -e REDIS_URI=redis://ordin-redis:6379 --network ordin-net -v "$(pwd)/$ENV_FILE":/app/server/.env:ro --restart unless-stopped "$IMAGE_NAME"
else
  docker run -d --name "$APP_NAME" -p "$SERVER_PORT:$SERVER_PORT" --network ordin-net -e REDIS_URI=redis://ordin-redis:6379 --restart unless-stopped "$IMAGE_NAME"
fi

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
