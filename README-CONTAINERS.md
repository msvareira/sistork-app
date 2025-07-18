# 🚀 SisTork - Sistema Completo Containerizado

Sistema de gestão para oficinas de motocicletas com frontend React e backend Laravel totalmente containerizado.

## 🏗️ Arquitetura

```
📦 SisTork
├── 🌐 Frontend (React + Vite)    → http://localhost:3000
├── 🚀 Backend (Laravel + PHP)    → http://localhost:8044
├── 🗄️ MySQL Database            → localhost:3345
├── 🔴 Redis Cache               → Container interno
└── 🤖 Ollama AI Service         → http://localhost:11434
```

## 🚀 Inicialização Rápida

### 1️⃣ Iniciar Sistema Completo
```powershell
.\start-complete.ps1
```

### 2️⃣ Parar Sistema
```powershell
.\stop-complete.ps1
```

### 3️⃣ Acessar Aplicação
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8044
- **Database:** localhost:3345

## 🔑 Credenciais

```
📧 Email: admin@sistork.com
🔑 Senha: password123
```

## 📋 Comandos Úteis

### Gerenciamento Geral
```powershell
# Ver status dos containers
docker-compose -f docker-compose.complete.yaml ps

# Ver logs em tempo real
docker-compose -f docker-compose.complete.yaml logs -f

# Rebuild completo
docker-compose -f docker-compose.complete.yaml up --build -d

# Parar tudo
docker-compose -f docker-compose.complete.yaml down
```

### Logs Específicos
```powershell
# Frontend logs
docker-compose -f docker-compose.complete.yaml logs -f frontend

# Backend logs
docker-compose -f docker-compose.complete.yaml logs -f backend

# MySQL logs
docker-compose -f docker-compose.complete.yaml logs -f mysql
```

### Acesso aos Containers
```powershell
# Acessar backend
docker exec -it sistork-backend bash

# Acessar MySQL
docker exec -it sistork-mysql mysql -u sistork -p

# Acessar frontend
docker exec -it sistork-frontend sh
```

## 🎯 Funcionalidades

### 💼 Sistema de Gestão
- ✅ **Orçamentos** com geração de PDF
- ✅ **Contas a Receber** com payment_date
- ✅ **Contas a Pagar** com payment_date
- ✅ **Fluxo de Caixa** com filtros avançados
- ✅ **PDV/Vendas** com integração completa
- ✅ **Dashboard** com métricas em tempo real

### 🤖 Tecnologias
- ✅ **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- ✅ **Backend:** Laravel 11 + PHP 8.2 + MySQL 8.0
- ✅ **Cache:** Redis Alpine
- ✅ **IA:** Ollama com modelos locais
- ✅ **Containerização:** Docker + Docker Compose

## 🔧 Desenvolvimento

### Estrutura de Pastas
```
📁 project/          → Frontend React
📁 back/             → Backend Laravel
📄 docker-compose.complete.yaml → Configuração completa
📄 start-complete.ps1 → Script de inicialização
📄 stop-complete.ps1  → Script de parada
```

### Variáveis de Ambiente

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8044/api
VITE_APP_NAME=SisTork
```

**Backend (.env)**
```env
DB_HOST=mysql
DB_DATABASE=sistork
DB_USERNAME=sistork
DB_PASSWORD=sistork123
REDIS_HOST=redis
OLLAMA_HOST=ollama
```

## 🐛 Troubleshooting

### Container não inicia
```powershell
# Verificar logs
docker-compose -f docker-compose.complete.yaml logs [service-name]

# Rebuild específico
docker-compose -f docker-compose.complete.yaml up --build [service-name]
```

### Problemas de permissão (Backend)
```powershell
# Acessar container e corrigir
docker exec -it sistork-backend bash
chown -R www-data:www-data /var/www/html/storage
chmod -R 755 /var/www/html/storage
```

### Reset completo
```powershell
# Parar tudo e limpar
docker-compose -f docker-compose.complete.yaml down
docker system prune -f
docker volume prune -f

# Reiniciar
.\start-complete.ps1
```

## 📊 Monitoramento

### Health Checks
- **Ollama:** Verificação automática de saúde
- **MySQL:** Aguarda inicialização completa
- **Backend:** Restart automático em caso de falha

### Volumes Persistentes
- **mysql_data:** Dados do banco de dados
- **ollama_data:** Modelos de IA baixados

## 🌐 Rede

Todos os serviços comunicam através da rede `sistork-network` isolada, garantindo:
- 🔒 **Segurança:** Isolamento de rede
- ⚡ **Performance:** Comunicação otimizada
- 🔧 **Flexibilidade:** Fácil escalabilidade

---

## 📝 Notas

- ⏱️ **Tempo de inicialização:** ~30-60 segundos
- 💾 **Espaço em disco:** ~2GB após build completo
- 🔄 **Auto-restart:** Containers reiniciam automaticamente
- 🗄️ **Persistência:** Dados mantidos entre reinicializações
