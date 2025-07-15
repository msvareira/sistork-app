<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Docker Configuration

This project includes a complete Docker setup for Laravel development with MySQL, Redis, and Nginx. The configuration is based on the official Laravel Docker documentation.

### Prerequisites

- Docker Desktop installed and running
- Git for version control

### Quick Start

1. **Build and start the containers:**
   ```bash
   docker-compose -f compose.dev.yaml up -d --build
   ```

2. **Install Laravel dependencies (if not already done):**
   ```bash
   docker-compose -f compose.dev.yaml exec workspace composer install
   ```

3. **Set up Laravel environment:**
   ```bash
   docker-compose -f compose.dev.yaml exec workspace cp .env.example .env
   docker-compose -f compose.dev.yaml exec workspace php artisan key:generate
   ```

4. **Run migrations:**
   ```bash
   docker-compose -f compose.dev.yaml exec workspace php artisan migrate
   ```

5. **Access the application:**
   - **Website**: http://localhost:8044
   - **MySQL**: localhost:3344 (user: root, password: password)

### Service Ports

- **Nginx (Laravel App)**: 8044 → 80
- **MySQL**: 3344 → 3306
- **Redis**: 6379 → 6379
- **Xdebug**: 9003

### Available Services

- **web**: Nginx web server
- **php-fpm**: PHP-FPM for Laravel
- **workspace**: CLI environment with PHP, Composer, Node.js
- **mysql**: MySQL 8.0 database
- **redis**: Redis cache/session store

### Common Commands

```bash
# Access workspace container
docker-compose -f compose.dev.yaml exec workspace bash

# Run Artisan commands
docker-compose -f compose.dev.yaml exec workspace php artisan [command]

# Install Composer packages
docker-compose -f compose.dev.yaml exec workspace composer install

# Install NPM packages
docker-compose -f compose.dev.yaml exec workspace npm install

# Build assets
docker-compose -f compose.dev.yaml exec workspace npm run dev

# Stop all services
docker-compose -f compose.dev.yaml down

# Rebuild containers
docker-compose -f compose.dev.yaml up -d --build
```

### Directory Structure

```
docker/
├── common/
│   └── php-fpm/
│       └── Dockerfile              # Multi-stage PHP-FPM image
├── development/
│   ├── php-fpm/
│   │   └── entrypoint.sh          # Laravel setup script
│   ├── workspace/
│   │   └── Dockerfile             # CLI container with tools
│   └── nginx/
│       └── nginx.conf             # Nginx configuration
├── compose.dev.yaml               # Development services
├── compose.prod.yaml              # Production services
└── .dockerignore                  # Docker ignore patterns
```

### Environment Configuration

The Docker setup uses the following key environment variables:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=password

# Cache/Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# App
APP_URL=http://localhost:8044
```

### Production Deployment

For production, use the production compose file:

```bash
docker-compose -f compose.prod.yaml up -d --build
```

### Troubleshooting

**Common Issues:**

1. **Port conflicts**: Make sure ports 8044 and 3344 are not in use
2. **Permission issues**: The containers automatically sync user permissions
3. **Database connection**: Ensure MySQL container is healthy before running migrations

**Useful Commands:**

```bash
# Check container status
docker-compose -f compose.dev.yaml ps

# View container logs
docker-compose -f compose.dev.yaml logs [service_name]

# Restart specific service
docker-compose -f compose.dev.yaml restart [service_name]

# Clean restart (removes volumes)
docker-compose -f compose.dev.yaml down -v
docker-compose -f compose.dev.yaml up -d --build
```

**⚠️ Safe Cleanup Commands:**

When cleaning Laravel files, use these commands to preserve Docker configuration:

```bash
# Safe: Remove only Laravel vendor and cache
rm -rf vendor/ bootstrap/cache/* storage/logs/*

# Safe: Clean Laravel while preserving Docker configs
find . -name "*.log" -delete
php artisan cache:clear
php artisan config:clear

# ❌ AVOID: This deletes Docker configurations
rm -rf * .[^.]*
```

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
