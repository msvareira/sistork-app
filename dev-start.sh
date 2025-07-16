#!/bin/bash

# Script para iniciar o ambiente completo de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento SisTork..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

echo "📦 Iniciando todo o ambiente (Backend + Frontend)..."
docker compose up -d

# Aguardar os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

echo "🎯 Verificando se a API está respondendo..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8044/api/health > /dev/null; then
        echo "✅ Backend está pronto!"
        break
    fi
    echo "⏳ Tentativa $attempt/$max_attempts - Aguardando backend..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Backend não ficou pronto em tempo hábil"
    exit 1
fi

echo " Verificando se o frontend está respondendo..."
max_attempts=15
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:5173 > /dev/null; then
        echo "✅ Frontend está pronto!"
        break
    fi
    echo "⏳ Tentativa $attempt/$max_attempts - Aguardando frontend..."
    sleep 2
    attempt=$((attempt + 1))
done

echo ""
echo "🎉 Ambiente de desenvolvimento iniciado com sucesso!"
echo ""
echo "📍 URLs disponíveis:"
echo "   🎨 Frontend: http://localhost:5173"
echo "   🔧 Backend:  http://localhost:8044"
echo "   📊 API:      http://localhost:8044/api"
echo ""
echo "👤 Credenciais de login:"
echo "   📧 Email: admin@oficina.com"
echo "   🔑 Senha: admin123"
echo ""
echo "� Containers em execução:"
echo "   • sistork-backend-nginx    (Nginx - Porta 8044)"
echo "   • sistork-backend-php      (PHP-FPM)"
echo "   • sistork-backend-mysql    (MySQL - Porta 3344)"
echo "   • sistork-backend-redis    (Redis)"
echo "   • sistork-backend-workspace (Workspace)"
echo "   • sistork-frontend-react   (React/Vite - Porta 5173)"
echo ""
echo "📝 Para parar os serviços:"
echo "   docker compose down"
echo ""
