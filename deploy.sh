#!/usr/bin/env bash
set -e

git pull origin main

if [ -f "./deploy/deploy.sh" ]; then
  chmod +x ./deploy/deploy.sh
  ./deploy/deploy.sh
else
  docker-compose down
  docker-compose up -d --build
  docker image prune -f
fi
