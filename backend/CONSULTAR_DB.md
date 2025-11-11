# Como Consultar Dados no PostgreSQL

Existem várias formas de verificar se os dados foram cadastrados no PostgreSQL:

## 1. Usando o Script de Verificação (Mais Fácil)

Execute o script que criamos:

```bash
npm run check-db
```

Este script mostra:
- Total de utilizadores, anúncios, locais, reações e bookmarks
- Lista dos últimos registros de cada tabela

## 2. Usando Prisma Studio (Interface Gráfica)

O Prisma Studio oferece uma interface visual para ver e editar os dados:

```bash
npx prisma studio
```

Depois abra no navegador: `http://localhost:5555`

## 3. Usando SQL Direto no PostgreSQL

### Conectar ao PostgreSQL via psql:

```bash
# Windows (se tiver psql instalado)
psql -h localhost -p 5433 -U postgres -d anunciosloc

# Ou usando a string de conexão completa
psql "postgresql://postgres:admin@localhost:5433/anunciosloc"
```

### Consultas SQL úteis:

```sql
-- Ver todos os utilizadores
SELECT id, username, email, "createdAt" FROM "User";

-- Contar utilizadores
SELECT COUNT(*) FROM "User";

-- Ver todos os anúncios com autor
SELECT 
  a.id, 
  a.content, 
  a."createdAt",
  u.username as author
FROM "Announcement" a
JOIN "User" u ON a."authorId" = u.id
ORDER BY a."createdAt" DESC;

-- Ver todos os locais
SELECT 
  l.id, 
  l.name, 
  l.type, 
  l."createdAt",
  u.username as owner
FROM "Location" l
JOIN "User" u ON l."ownerId" = u.id;

-- Ver reações
SELECT 
  r.id,
  r.type,
  u.username as user,
  a.content as announcement
FROM "Reaction" r
JOIN "User" u ON r."userId" = u.id
JOIN "Announcement" a ON r."announcementId" = a.id;

-- Ver bookmarks
SELECT 
  b.id,
  u.username as user,
  a.content as announcement
FROM "Bookmark" b
JOIN "User" u ON b."userId" = u.id
JOIN "Announcement" a ON b."announcementId" = a.id;

-- Verificar se um utilizador específico existe
SELECT * FROM "User" WHERE email = 'andre@gmail.com';

-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 4. Usando um Cliente PostgreSQL (pgAdmin, DBeaver, etc.)

1. **pgAdmin**: Interface gráfica oficial do PostgreSQL
2. **DBeaver**: Cliente universal de banco de dados
3. **TablePlus**: Cliente moderno e rápido

**Configuração de conexão:**
- Host: `localhost`
- Porta: `5433`
- Database: `anunciosloc`
- Username: `postgres`
- Password: `admin`

## 5. Testando via API

Depois de registrar um utilizador via API, você pode verificar:

```bash
# Registrar um utilizador
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "andre",
    "email": "andre@gmail.com",
    "password": "123456"
  }'

# Depois verificar no banco usando o script
npm run check-db
```

## Dica

Para verificar rapidamente após um registro, use:

```bash
npm run check-db
```

Este comando mostra todos os dados de forma organizada e fácil de ler!


