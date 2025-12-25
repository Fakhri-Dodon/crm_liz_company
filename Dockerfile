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

# Tambahkan php-extensions-helper atau install manual pdo_mysql
RUN apk add --no-cache nginx git icu-dev libpng-dev libzip-dev zip unzip mysql-client

# BARIS PENTING: Menginstall driver MySQL
RUN docker-php-ext-install pdo pdo_mysql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY nginx.conf /etc/nginx/http.d/default.conf

COPY . .
COPY --from=frontend /app/public/build /var/www/html/public/build

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
CMD php-fpm -D && nginx -g "daemon off;"