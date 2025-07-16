# SisTork - Sistema de Gestão para Oficina de Motos

Sistema completo de gestão para oficina de motos e motopeças, desenvolvido com Laravel (Backend) e React (Frontend).

## 🚀 Início Rápido

### Pré-requisitos
- Docker e Docker Compose
- Git

### Iniciando o Ambiente Completo

#### Windows (PowerShell)
```powershell
.\dev-start.ps1
```

#### Linux/macOS
```bash
chmod +x dev-start.sh
./dev-start.sh
```

#### Manual
```bash
# Na raiz do projeto
docker compose up -d
```

## 📍 URLs de Acesso

- **Frontend (React)**: http://localhost:5173
- **Backend (Laravel)**: http://localhost:8044
- **API**: http://localhost:8044/api

## 👤 Credenciais de Acesso

- **Email**: admin@oficina.com
- **Senha**: admin123

## 🐳 Containers Docker

O sistema utiliza os seguintes containers:

### Backend (Laravel)
- `sistork-backend-nginx` - Servidor web Nginx (porta 8044)
- `sistork-backend-php` - PHP-FPM 
- `sistork-backend-mysql` - Banco de dados MySQL (porta 3344)
- `sistork-backend-redis` - Cache Redis
- `sistork-backend-workspace` - Ambiente de trabalho para comandos Artisan

### Frontend (React)
- `sistork-frontend-react` - Aplicação React com Vite (porta 5173)

## 🛠️ Desenvolvimento

### Comandos Docker Úteis

```bash
# Parar todos os serviços
docker compose down

# Ver logs de um container específico
docker compose logs sistork-backend-nginx
docker compose logs sistork-frontend-react

# Executar comandos no backend
docker compose exec sistork-workspace bash
docker compose exec sistork-workspace php artisan migrate
docker compose exec sistork-workspace php artisan tinker

# Reconstruir imagens
docker compose build --no-cache

# Ver status dos containers
docker compose ps
```

### Estrutura do Projeto

```
SisTork/
├── back/                           # Backend Laravel
│   ├── app/                        # Código da aplicação
│   ├── database/                   # Migrações e seeders
│   ├── docker/                     # Configurações Docker
│   └── compose.dev.yaml           # Docker Compose do backend
├── project/                        # Frontend React
│   ├── src/                        # Código fonte React
│   ├── Dockerfile                  # Dockerfile do frontend
│   └── docker-compose.yml         # Docker Compose do frontend
├── docker-compose.yml             # Docker Compose completo
├── dev-start.ps1                  # Script de início (Windows)
├── dev-start.sh                   # Script de início (Linux/macOS)
└── auth-test.html                 # Teste de autenticação
```

### Funcionalidades

- 👥 **Gestão de Clientes** - Cadastro e controle de clientes
- 🔧 **Gestão de Serviços** - Controle de serviços realizados
- 📦 **Controle de Estoque** - Gestão de peças e produtos
- 💰 **Orçamentos** - Sistema completo de orçamentos
- 📅 **Agendamentos** - Controle de agenda da oficina
- 🛒 **PDV** - Ponto de venda integrado
- 🔐 **Autenticação** - Sistema seguro com Laravel Sanctum

### Tecnologias

**Backend:**
- Laravel 11
- MySQL 8.0
- Redis
- Docker
- Laravel Sanctum (Autenticação)

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (Ícones)

## 🔧 Troubleshooting

### Problemas Comuns

1. **Porta em uso**
   ```bash
   # Verificar o que está usando a porta
   netstat -an | findstr :8044
   netstat -an | findstr :5173
   ```

2. **Permissões Docker**
   ```bash
   # Linux: adicionar usuário ao grupo docker
   sudo usermod -aG docker $USER
   ```

3. **Limpar containers e volumes**
   ```bash
   docker compose down -v
   docker system prune -a
   ```

### Logs e Debug

```bash
# Ver logs em tempo real
docker compose logs -f sistork-backend-nginx
docker compose logs -f sistork-frontend-react

# Verificar saúde dos containers
docker compose ps
```

## 📝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
