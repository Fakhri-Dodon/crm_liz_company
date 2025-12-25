# --- Tahap 1: Build Frontend (Node.js/NPM) ---
# Menggunakan image Node.js LTS terbaru (ganti '20' jika versi lokal Anda berbeda)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
# Jalankan npm install
RUN npm install
COPY . .
# Jalankan build vite/react
RUN npm run build

# --- Tahap 2: Build Backend (PHP/Composer) dan Gabungkan Aset ---
# Menggunakan image PHP FPM LTS terbaru (ganti '8.3' jika versi lokal Anda berbeda)
FROM php:8.3-fpm-alpine AS backend
WORKDIR /var/www/html

# Instal dependensi sistem yang dibutuhkan PHP (git, nginx, dll)
RUN apk add --no-cache nginx git

# Salin file konfigurasi Nginx kustom yang akan kita buat di Langkah 2
COPY nginx.conf /etc/nginx/http.d/default.conf

# Salin aset React yang sudah di-build dari tahap frontend ke public folder Laravel
COPY --from=frontend /app/public /var/www/html/public

# Salin sisa kode Laravel Anda
COPY . .

# Instal Composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Atur permission storage/bootstrap cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage

# Expose port 8000 dan jalankan Nginx (Nginx akan mengurus serving React & PHP)
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
