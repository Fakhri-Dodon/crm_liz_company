# --- Tahap 1: Build Frontend ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
# Perbaikan untuk bug rollup di Alpine
RUN npm install && npm install @rollup/rollup-linux-x64-musl
COPY . .
RUN npm run build

# --- Tahap 2: Backend (PHP 8.3 + Nginx) ---
FROM php:8.3-fpm-alpine AS backend
WORKDIR /var/www/html

# Install dependensi sistem dan ekstensi PHP yang dibutuhkan Laravel 12 & TiDB
RUN apk add --no-cache \
    nginx \
    git \
    icu-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    mysql-client && \
    docker-php-ext-install pdo pdo_mysql bcmath intl

# Ambil composer terbaru
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy konfigurasi Nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# 1. Copy file composer dahulu untuk memanfaatkan Docker Layer Caching
COPY composer.json composer.lock ./

# 2. Install library TANPA menjalankan skrip artisan (menghindari error build)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# 3. Copy seluruh source code aplikasi
COPY . .

# 4. Copy hasil build frontend dari tahap 1
COPY --from=frontend /app/public/build /var/www/html/public/build

# 5. Jalankan dump-autoload secara manual untuk optimasi classmap tanpa memicu artisan
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Atur permission folder storage dan cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

# Jalankan PHP-FPM dan Nginx
CMD php-fpm -D && nginx -g "daemon off;"