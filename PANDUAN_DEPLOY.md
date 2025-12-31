# Panduan Deployment Ordin App ke Server Docker

Berikut adalah langkah-langkah untuk men-deploy aplikasi ke server IDCloudHost Anda yang sudah terinstall Docker.

## Prasyarat
- Server sudah bisa diakses via SSH.
- Docker dan Docker Compose sudah terinstall (Terlihat sudah ada Docker 20.10 di screenshot).
- Git sudah terinstall di server.

## Langkah 1: Masuk ke Server
Gunakan terminal (atau fitur "Terminal" di dashboard IDCloudHost) untuk masuk ke server.
Username terlihat `ordinapp` di screenshot.

```bash
ssh ordinapp@103.49.238.193
# Masukkan password jika diminta
```

## Langkah 2: Clone Repository (Jika belum ada)
Jika ini pertama kali, clone repository Anda ke server.

```bash
git clone https://github.com/devcapybara/ordin.git
cd ordin
```

Jika folder `ordin` sudah ada, cukup masuk ke foldernya:
```bash
cd ordin
```

## Langkah 3: Jalankan Script Deployment
Kami telah membuat script `deploy.sh` untuk mempermudah proses.

1.  **Berikan izin eksekusi pada script:**
    ```bash
    chmod +x deploy.sh
    ```

2.  **Jalankan deployment:**
    ```bash
    ./deploy.sh
    ```

Script ini akan otomatis:
1.  Menarik code terbaru dari branch `main`.
2.  Membangun ulang Docker image (termasuk frontend build).
3.  Menjalankan container di background.

## Langkah 4: Akses Aplikasi
Setelah selesai, aplikasi dapat diakses melalui browser di:
`http://103.49.238.193:5000`

## Catatan Tambahan
- **Update di masa depan**: Cukup jalankan `./deploy.sh` lagi setiap kali Anda ingin mengupdate aplikasi dari branch `main`.
- **Environment Variables**: Jika Anda ingin mengubah konfigurasi (seperti `JWT_SECRET`), edit file `docker-compose.yml` di server atau gunakan file `.env`.
