#!/bin/bash
set -e

echo "Starting PHP-FPM container..."

# Check if Laravel project exists
if [ -f "artisan" ]; then
    echo "Laravel project detected"
    
    # Only run Laravel setup in development
    if [ "$APP_ENV" = "local" ] || [ "$APP_ENV" = "development" ]; then
        echo "Development environment detected"
        
        # Install/update composer dependencies if vendor doesn't exist
        if [ -f "composer.json" ] && [ ! -d "vendor" ]; then
            echo "Installing composer dependencies..."
            composer install
        fi
        
        # Generate app key if not set and .env exists
        if [ -f ".env" ] && ([ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]); then
            echo "Generating application key..."
            php artisan key:generate --force
        fi
        
        # Wait for database and run migrations if .env is configured
        if [ -f ".env" ] && grep -q "DB_HOST" .env; then
            echo "Waiting for database connection..."
            counter=0
            until php artisan migrate:status &> /dev/null || [ $counter -eq 30 ]; do
                echo "Database is unavailable - sleeping (attempt $((counter + 1))/30)"
                sleep 2
                ((counter++))
            done
            
            if [ $counter -lt 30 ]; then
                echo "Database is up! Running migrations..."
                php artisan migrate --force
                
                # Clear caches
                php artisan config:clear || true
                php artisan cache:clear || true
                php artisan route:clear || true
                php artisan view:clear || true
                
                echo "Laravel setup completed successfully!"
            else
                echo "Database connection timeout - skipping migrations"
            fi
        else
            echo "No database configuration found - skipping migrations"
        fi
    fi
else
    echo "No Laravel project found."
    echo "You can install Laravel by running:"
    echo "  docker compose -f compose.dev.yaml exec workspace composer create-project laravel/laravel ."
fi

# Execute the original command
exec "$@"
