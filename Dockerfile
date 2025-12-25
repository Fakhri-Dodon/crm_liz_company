# --- Tahap 1: Build Frontend (Vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Perintah ini akan menghasilkan folder public/build
RUN npm run build

# --- Tahap 2: Backend (PHP 8.3 + Nginx) ---
FROM php:8.3-fpm-alpine AS backend
WORKDIR /var/www/html

# 1. Instal dependensi sistem yang dibutuhkan Laravel
RUN apk add --no-cache \
    nginx \
    git \
    icu-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip

# 2. Instal Composer secara resmi
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 3. Salin konfigurasi Nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# 4. Salin seluruh kode project
COPY . .

# 5. Salin hasil build Vite dari tahap frontend ke folder public
# Laravel Vite meletakkan hasilnya di public/build
COPY --from=frontend /app/public/build /var/www/html/public/build

# 6. Jalankan Composer Install
RUN composer install --no-dev --optimize-autoloader

# 7. Atur Permissions untuk Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Jalankan PHP-FPM dan Nginx
EXPOSE 8000
CMD php-fpm -D && nginx -g "daemon off;"