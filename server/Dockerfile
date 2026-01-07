FROM php:8.2-apache
WORKDIR /var/www/html

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite

# Copy Laravel app
COPY . .

# Set permissions
RUN chmod -R 755 storage bootstrap/cache

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
