# Smartwatering Laravel API (server) — Sanctum Token Auth

## One-time setup
```
cd server
composer create-project laravel/laravel .
composer require laravel/sanctum guzzlehttp/guzzle
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```
If you use SQLite (quickest):
```
mkdir database
# Windows PowerShell:
# New-Item -ItemType file database\\database.sqlite
# CMD:
# type NUL > database\\database.sqlite
```
Edit `.env`:
```
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

## Start API
```
php artisan serve
```
Base URL: http://127.0.0.1:8000/api

## Auth endpoints
- POST /api/register { name, email, password }
- POST /api/login { email, password } -> { token }
- GET  /api/me (Bearer token)
- POST /api/logout (Bearer token)

## Device endpoints (protected)
- GET  /api/stats
- POST /api/water-now
- POST /api/auto-mode

## CORS
config/cors.php already allows http://localhost:5173 and http://127.0.0.1:5173
