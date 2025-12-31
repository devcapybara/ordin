#!/bin/bash

# Pastikan script berhenti jika ada error
set -e

echo "🚀 Memulai deployment Ordin App..."

# 1. Pull code terbaru dari branch main
echo "📥 Mengambil update terbaru dari git..."
git pull origin main

# 2. Build ulang container dan restart
echo "🐳 Membuild dan menjalankan container..."
docker-compose down
docker-compose up -d --build

# 3. Bersihkan image yang tidak terpakai (optional, untuk menghemat space)
echo "🧹 Membersihkan image lama..."
docker image prune -f

echo "✅ Deployment selesai! Aplikasi berjalan di port 5000."
