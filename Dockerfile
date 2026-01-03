# --- Tahap 1: Build Frontend ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install @rollup/rollup-linux-x64-musl
COPY . .

# Buat file .env bayangan agar Vite tidak kosong saat build
RUN echo "VITE_REVERB_APP_KEY=lizeverywherekey" > .env && \
    echo "VITE_REVERB_HOST=established-maxy-syntaxid-e1fbc0af.koyeb.app" >> .env && \
    echo "VITE_REVERB_PORT=443" >> .env && \
    echo "VITE_REVERB_SCHEME=https" >> .env

RUN npm run build

# --- Tahap 2: Backend (PHP 8.3 + Nginx) ---
FROM php:8.3-fpm-alpine AS backend
WORKDIR /var/www/html

# Tambahkan pcntl di sini
RUN apk add --no-cache nginx git icu-dev libpng-dev libzip-dev zip unzip mysql-client && \
    docker-php-ext-install pdo pdo_mysql bcmath intl pcntl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY nginx.conf /etc/nginx/http.d/default.conf

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
COPY --from=frontend /app/public/build /var/www/html/public/build

RUN composer dump-autoload --optimize --no-dev --classmap-authoritative --no-scripts

RUN mkdir -p /var/www/html/storage/logs /var/www/html/storage/framework/views /var/www/html/storage/framework/sessions /var/www/html/storage/framework/cache \
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN touch /var/www/html/storage/logs/laravel.log && chmod 666 /var/www/html/storage/logs/laravel.log

EXPOSE 8000

# Jalankan Reverb, PHP-FPM, dan Nginx
CMD php-fpm -D && \
    php artisan reverb:start --host=0.0.0.0 --port=8081 & \
    php artisan queue:work --tries=3 --timeout=90 & \
    nginx -g "daemon off;"