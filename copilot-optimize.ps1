param(
    [string]$Action = "status"
)

Write-Host "COPILOT OPTIMIZER" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

switch ($Action) {
    "status" {
        Write-Host "Verificando arquivos que o Copilot esta processando..." -ForegroundColor Yellow
        
        # Contar arquivos de codigo relevantes
        $codeFiles = Get-ChildItem -Recurse -File | Where-Object { 
            $_.Extension -in @('.ts', '.tsx', '.js', '.jsx', '.php') -and
            $_.DirectoryName -notmatch 'node_modules|vendor|dist|build|storage|coverage|\.git' 
        }
        
        # Contar arquivos excluidos
        $excludedFiles = Get-ChildItem -Recurse -File | Where-Object { 
            $_.DirectoryName -match 'node_modules|vendor|dist|build|storage|coverage' -or
            $_.Extension -in @('.log', '.cache', '.lock', '.md', '.jpg', '.png', '.gif')
        }
        
        Write-Host "Arquivos de codigo relevantes: $($codeFiles.Count)" -ForegroundColor Green
        Write-Host "Arquivos excluidos: $($excludedFiles.Count)" -ForegroundColor Red
        Write-Host "Reducao estimada: $(($excludedFiles.Count / ($codeFiles.Count + $excludedFiles.Count) * 100).ToString("0.0"))%" -ForegroundColor Magenta
        
        Write-Host "`nDistribuicao por tipo:" -ForegroundColor Cyan
        $codeFiles | Group-Object Extension | Sort-Object Count -Descending | ForEach-Object {
            Write-Host "   $($_.Name): $($_.Count) arquivos" -ForegroundColor White
        }
    }
    
    "optimize" {
        Write-Host "Aplicando otimizacoes..." -ForegroundColor Yellow
        
        # Verificar se arquivos de configuracao existem
        $configFiles = @(
            ".copilotignore",
            ".vscode\settings.json",
            ".gitignore"
        )
        
        foreach ($file in $configFiles) {
            if (Test-Path $file) {
                Write-Host "   $file configurado" -ForegroundColor Green
            } else {
                Write-Host "   $file nao encontrado" -ForegroundColor Red
            }
        }
        
        Write-Host "`nDicas para reduzir ainda mais:" -ForegroundColor Cyan
        Write-Host "   1. Feche abas desnecessarias" -ForegroundColor White
        Write-Host "   2. Use File > Close Folder em subpastas nao utilizadas" -ForegroundColor White
        Write-Host "   3. Desabilite extensoes nao essenciais" -ForegroundColor White
    }
    
    default {
        Write-Host "Uso:" -ForegroundColor White
        Write-Host "   .\copilot-optimize.ps1 status    - Ver status atual" -ForegroundColor Gray
        Write-Host "   .\copilot-optimize.ps1 optimize  - Verificar configuracoes" -ForegroundColor Gray
    }
}

Write-Host "`nOtimizacao concluida!" -ForegroundColor Green
