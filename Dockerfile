# --- Tahap 1: Build Frontend ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install @rollup/rollup-linux-x64-musl
COPY . .
RUN npm run build

# --- Tahap 2: Backend (PHP 8.3 + Nginx) ---
FROM php:8.3-fpm-alpine AS backend
WORKDIR /var/www/html

# Install dependensi sistem & ekstensi PHP
RUN apk add --no-cache nginx git icu-dev libpng-dev libzip-dev zip unzip mysql-client && \
    docker-php-ext-install pdo pdo_mysql bcmath intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY nginx.conf /etc/nginx/http.d/default.conf

# 1. Copy composer files
COPY composer.json composer.lock ./

# 2. Install dependencies tanpa skrip (mencegah error Pusher/Reverb saat build)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# 3. Copy source code & hasil build frontend
COPY . .
COPY --from=frontend /app/public/build /var/www/html/public/build

# 4. Dump autoload tanpa menjalankan artisan discover (SOLUSI KRUSIAL)
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative --no-scripts

# 5. Permission
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
CMD php-fpm -D && nginx -g "daemon off;"