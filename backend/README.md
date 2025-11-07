# AnunciosLoc Backend

API simples em Node.js + Express + Prisma + PostgreSQL para suportar o frontend Expo.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuração

1. Copiar `env.example` para `.env` e atualizar as variáveis:
   ```bash
   cp env.example .env
   ```

2. Instalar dependências:
   ```bash
   npm install
   ```

3. Gerar o cliente Prisma e aplicar migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Correr em modo desenvolvimento:
   ```bash
   npm run dev
   ```

5. Endpoints expostos em `http://localhost:4000/api`.

## Rotas principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/locations`
- `GET|POST|PUT|DELETE /api/announcements`
- `POST|DELETE /api/announcements/:id/like`
- `POST|DELETE /api/announcements/:id/bookmark`
- Documentação Swagger disponível em `http://localhost:4000/docs`

## Estrutura

- `src/app.ts` – configuração do Express
- `src/routes` – rotas (auth, anúncios, locais)
- `src/middleware` – middlewares de autenticação
- `src/utils` – helpers (tokens, hashing)
- `prisma/schema.prisma` – modelos de dados

## Deploy rápido

- Hospedar o Node.js em Railway/Render/Fly.io
- Usar um Postgres gerido (Neon, Supabase, Railway)
- Definir as variáveis de ambiente `DATABASE_URL`, `JWT_SECRET` e `PORT`

