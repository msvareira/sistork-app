#!/usr/bin/env pwsh

Write-Host ""
Write-Host "🚀 Iniciando SisTork - Sistema Completo" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yaml down 2>$null | Out-Null

Write-Host "🧹 Limpando containers órfãos..." -ForegroundColor Yellow
docker container prune -f 2>$null | Out-Null

Write-Host "🏗️ Construindo e iniciando todos os serviços..." -ForegroundColor Cyan
Write-Host "   📦 Frontend (React + Vite)" -ForegroundColor White
Write-Host "   🚀 Backend (Laravel + PHP)" -ForegroundColor White
Write-Host "   🗄️ MySQL Database" -ForegroundColor White
Write-Host "   🔴 Redis Cache" -ForegroundColor White
Write-Host "   🤖 Ollama AI Service" -ForegroundColor White
Write-Host ""

docker-compose -f docker-compose.complete.yaml up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "⏱️ Aguardando serviços iniciarem..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "📊 Status dos containers:" -ForegroundColor Green
    docker-compose -f docker-compose.complete.yaml ps
    
    Write-Host ""
    Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌐 URLs de Acesso:" -ForegroundColor Cyan
    Write-Host "   Frontend (React):  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend (API):     http://localhost:8044" -ForegroundColor White
    Write-Host "   MySQL Database:    localhost:3345" -ForegroundColor White
    Write-Host "   Ollama AI:         http://localhost:11434" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔑 Credenciais de Teste:" -ForegroundColor Cyan
    Write-Host "   Email:    admin@sistork.com" -ForegroundColor White
    Write-Host "   Senha:    password123" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📋 Comandos Úteis:" -ForegroundColor Cyan
    Write-Host "   Parar sistema:    .\stop-complete.ps1" -ForegroundColor White
    Write-Host "   Ver logs:         docker-compose -f docker-compose.complete.yaml logs -f" -ForegroundColor White
    Write-Host "   Rebuild:          docker-compose -f docker-compose.complete.yaml up --build -d" -ForegroundColor White
    Write-Host "   Status:           docker-compose -f docker-compose.complete.yaml ps" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 Funcionalidades Disponíveis:" -ForegroundColor Cyan
    Write-Host "   ✅ Sistema de Orçamentos com PDF" -ForegroundColor White
    Write-Host "   ✅ Contas a Receber e Pagar" -ForegroundColor White
    Write-Host "   ✅ Fluxo de Caixa com Filtros" -ForegroundColor White
    Write-Host "   ✅ PDV e Sistema de Vendas" -ForegroundColor White
    Write-Host "   ✅ Dashboard Completo" -ForegroundColor White
    Write-Host "   ✅ IA Integrada (Ollama)" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Erro ao iniciar o sistema!" -ForegroundColor Red
    Write-Host "💡 Verifique os logs com: docker-compose -f docker-compose.complete.yaml logs" -ForegroundColor Yellow
}
