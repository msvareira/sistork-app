# SisTork - Sistema de Gestão para Oficina

Sistema completo de gestão para oficina de motos e motopeças com comunicação segura entre backend e frontend.

## 🔐 Configuração de Segurança

### Backend (Laravel)

#### 1. Autenticação com Laravel Sanctum
- **Token-based authentication** para APIs
- **Tokens com expiração** configurável (24h por padrão)
- **Revogação automática** de tokens em logout

#### 2. CORS Configurado
- **Origens permitidas**: localhost:8044, localhost:3000, localhost:5173
- **Métodos permitidos**: GET, POST, PUT, DELETE, OPTIONS
- **Headers permitidos**: Content-Type, Authorization, X-Requested-With
- **Credentials**: Suportado para cookies de sessão

#### 3. Middleware de Segurança
- **Verificação de origem** para requests CORS
- **Headers de segurança** automáticos
- **Rate limiting** (Laravel padrão)

### Frontend (React/TypeScript)

#### 1. API Client Seguro
- **Token automático** em todas as requests
- **Interceptação de erros** 401 (redirecionamento para login)
- **Headers de segurança** automáticos
- **Tratamento de CORS** adequado

#### 2. Gerenciamento de Estado
- **Context API** para autenticação
- **LocalStorage seguro** para tokens
- **Verificação automática** de autenticação

## 🚀 Como Usar

### Backend

1. **Instalar dependências**:
```bash
cd back
composer install
```

2. **Configurar banco de dados**:
```bash
php artisan migrate
```

3. **Iniciar containers**:
```bash
docker compose -f compose.dev.yaml up -d
```

### Frontend

1. **Instalar dependências**:
```bash
cd project
npm install
```

2. **Iniciar desenvolvimento**:
```bash
npm run dev
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/logout` - Logout (requer autenticação)
- `GET /api/auth/user` - Dados do usuário atual (requer autenticação)

### Usuários
- `GET /api/users` - Listar usuários (requer autenticação)

### Health Check
- `GET /api/health` - Status da API

## 🔧 Configuração de Ambiente

### Backend (.env)
```env
# Frontend Configuration
FRONTEND_URL=http://localhost:8044

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8044,localhost:3000,localhost:5173
SANCTUM_TOKEN_EXPIRATION=1440

# Security
CORS_ALLOWED_ORIGINS=http://localhost:8044,http://localhost:3000,http://localhost:5173
```

### Frontend (.env)
```env
# Backend API Configuration
VITE_API_URL=http://localhost:8044/api
VITE_APP_URL=http://localhost:8044

# Application Configuration
VITE_APP_NAME=SisTork
VITE_APP_VERSION=1.0.0
```

## 🛡️ Recursos de Segurança

### Implementados
✅ **Autenticação JWT** com Laravel Sanctum  
✅ **CORS configurado** para domínios específicos  
✅ **Headers de segurança** automáticos  
✅ **Validação de tokens** em todas as rotas protegidas  
✅ **Interceptação de erros** 401 no frontend  
✅ **Sanitização de dados** de entrada  
✅ **Rate limiting** padrão do Laravel  

### Recomendações para Produção
🔒 **HTTPS obrigatório**  
🔒 **Firewall configurado**  
🔒 **Logs de segurança**  
🔒 **Backup automático**  
🔒 **Monitoramento de performance**  

## 📊 Monitoramento

O sistema inclui:
- **Health check endpoint** para monitoramento
- **Logs estruturados** para debugging
- **Error tracking** para falhas de API

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Docker: `docker compose logs`
2. Verifique os logs do Laravel: `back/storage/logs/`
3. Verifique o console do navegador para erros do frontend
