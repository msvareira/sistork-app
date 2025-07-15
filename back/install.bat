@echo off
echo ========================================
echo  Laravel Docker Setup - Windows
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker não está instalado ou não está rodando!
    echo    Por favor, instale o Docker Desktop e inicie-o.
    pause
    exit /b 1
)

echo ✅ Docker detectado!
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker Compose não está disponível!
    echo    Certifique-se de que o Docker Desktop está atualizado.
    pause
    exit /b 1
)

echo ✅ Docker Compose detectado!
echo.

REM Build and start containers
echo 🚀 Construindo e iniciando containers...
docker-compose -f compose.dev.yaml up -d --build

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro ao iniciar containers!
    pause
    exit /b 1
)

echo.
echo ✅ Containers iniciados com sucesso!
echo.

REM Wait a bit for containers to be ready
echo ⏳ Aguardando containers ficarem prontos...
timeout /t 10 /nobreak >nul

REM Check if Laravel is already installed
if exist "artisan" (
    echo ✅ Laravel já está instalado!
    goto setup_env
)

echo 📦 Instalando dependências do Laravel...
docker-compose -f compose.dev.yaml exec workspace composer install

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo    Tentando instalar via container...
    docker-compose -f compose.dev.yaml exec workspace composer install --ignore-platform-reqs
)

:setup_env
REM Setup Laravel environment
echo 🔧 Configurando ambiente Laravel...

if not exist ".env" (
    echo    Copiando .env.example para .env...
    docker-compose -f compose.dev.yaml exec workspace cp .env.example .env
)

echo    Gerando chave da aplicação...
docker-compose -f compose.dev.yaml exec workspace php artisan key:generate

echo    Aguardando MySQL ficar disponível...
timeout /t 15 /nobreak >nul

echo    Executando migrações...
docker-compose -f compose.dev.yaml exec workspace php artisan migrate --force

if %ERRORLEVEL% neq 0 (
    echo ⚠️  Migrações falharam - Isso é normal se o banco ainda não estiver pronto.
    echo    Você pode executar manualmente depois: docker-compose -f compose.dev.yaml exec workspace php artisan migrate
)

echo.
echo ========================================
echo  🎉 Instalação Concluída!
echo ========================================
echo.
echo 🌐 Aplicação: http://localhost:8044
echo 🗄️  MySQL: localhost:3344 (root/password)
echo.
echo Comandos úteis:
echo   docker-compose -f compose.dev.yaml ps          - Status dos containers
echo   docker-compose -f compose.dev.yaml logs        - Logs dos containers  
echo   docker-compose -f compose.dev.yaml exec workspace bash - Acessar container CLI
echo   docker-compose -f compose.dev.yaml down        - Parar containers
echo.
pause
