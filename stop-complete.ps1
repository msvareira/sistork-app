#!/usr/bin/env pwsh

Write-Host ""
Write-Host "🛑 Parando SisTork - Sistema Completo" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red
Write-Host ""

Write-Host "🔽 Parando todos os containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yaml down

Write-Host ""
Write-Host "📊 Status final dos containers:" -ForegroundColor Green
docker-compose -f docker-compose.complete.yaml ps

Write-Host ""
Write-Host "✅ Sistema parado com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "🧹 Para limpeza completa (opcional):" -ForegroundColor Yellow
Write-Host "   docker system prune -f" -ForegroundColor White
Write-Host "   docker volume prune -f" -ForegroundColor White
Write-Host ""
