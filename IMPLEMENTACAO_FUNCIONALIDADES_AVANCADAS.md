# 🚀 Implementação das Funcionalidades Avançadas

## ✅ Status: IMPLEMENTADO

Este documento descreve as funcionalidades avançadas que foram implementadas no projeto AnunciosLoc.

---

## 📦 1. Sistema de Mulas (Roteamento de Retransmissão)

### O que foi implementado:

#### Backend:

1. **Modelos de Dados (Prisma):**
   - `MuleConfig`: Configuração de mula por usuário (espaço máximo, ativo/inativo)
   - `MuleMessage`: Mensagens em trânsito via mulas (status: PENDING, IN_TRANSIT, DELIVERED, EXPIRED)

2. **Endpoints API:**
   - `GET /api/mules/config` - Obter configuração de mula do usuário
   - `POST /api/mules/config` - Configurar espaço de mula (maxSpaceBytes, isActive)
   - `GET /api/mules/available?announcementId=xxx` - Listar mulas disponíveis para uma mensagem
   - `POST /api/mules/send` - Enviar mensagem via mula
   - `GET /api/mules/messages` - Listar mensagens que o usuário está transportando
   - `POST /api/mules/deliver` - Entregar mensagem ao destino

3. **Lógica de Eleição de Mulas:**
   - Filtra mulas que estão no mesmo local que o publicador
   - Verifica espaço disponível (considera mensagens em trânsito)
   - Evita duplicatas (não permite enviar a mesma mensagem duas vezes)
   - Máximo de 1 salto: `Publicador → Mula → Destino`

4. **Lógica de Entrega:**
   - Verifica se mula e destino estão no mesmo local
   - Marca mensagem como DELIVERED
   - Cria ReceivedAnnouncement automaticamente

#### Como funciona:

1. **Publicador quer enviar mensagem via mula:**
   - Chama `GET /api/mules/available?announcementId=xxx`
   - Recebe lista de mulas disponíveis no mesmo local
   - Escolhe uma mula e chama `POST /api/mules/send`

2. **Mula transporta mensagem:**
   - Mula vê mensagens pendentes em `GET /api/mules/messages`
   - Quando mula chega ao local de destino, chama `POST /api/mules/deliver`
   - Sistema verifica se mula e destino estão no mesmo local
   - Se sim, marca como entregue e cria ReceivedAnnouncement

3. **Configuração:**
   - Usuário pode configurar espaço máximo (padrão: 10MB)
   - Usuário pode ativar/desativar função de mula

### Exemplo de uso:

```typescript
// 1. Configurar espaço de mula
POST /api/mules/config
{
  "maxSpaceBytes": 10485760, // 10MB
  "isActive": true
}

// 2. Listar mulas disponíveis
GET /api/mules/available?announcementId=abc123

// 3. Enviar via mula
POST /api/mules/send
{
  "announcementId": "abc123",
  "muleUserId": "mula-user-id",
  "destinationUserId": "dest-user-id"
}

// 4. Mula entrega mensagem
POST /api/mules/deliver
{
  "muleMessageId": "mule-msg-id"
}
```

---

## 🔐 2. Sistema de Assinaturas Digitais

### O que foi implementado:

#### Backend:

1. **Biblioteca de Criptografia (`backend/src/lib/crypto.ts`):**
   - `generateKeyPair()`: Gera par de chaves RSA 2048-bit
   - `signMessage()`: Assina mensagem com chave privada (SHA256)
   - `verifySignature()`: Verifica assinatura com chave pública
   - `encryptPrivateKey()`: Criptografa chave privada com senha
   - `decryptPrivateKey()`: Descriptografa chave privada

2. **Modelos de Dados:**
   - `User.publicKey`: Chave pública do usuário (armazenada no banco)
   - `User.privateKey`: Chave privada (criptografada ou em texto plano)
   - `Announcement.signature`: Assinatura digital da mensagem
   - `Announcement.publicKey`: Chave pública do autor (para verificação)

3. **Endpoints API:**
   - `POST /api/crypto/generate-keys` - Gerar par de chaves para usuário
   - `GET /api/crypto/public-key` - Obter chave pública do usuário

4. **Assinatura Automática:**
   - Ao criar anúncio, se usuário tiver chaves, mensagem é assinada automaticamente
   - Assinatura inclui: conteúdo + autor + timestamp

5. **Verificação Automática:**
   - Ao buscar anúncios, verifica assinatura automaticamente
   - Retorna campo `isVerified: boolean` em cada anúncio

#### Como funciona:

1. **Gerar chaves:**
   ```typescript
   POST /api/crypto/generate-keys
   {
     "password": "senha-opcional" // Para criptografar chave privada
   }
   ```

2. **Criar anúncio assinado:**
   - Se usuário tiver chaves, anúncio é assinado automaticamente
   - Assinatura é salva no banco junto com chave pública

3. **Verificar assinatura:**
   - Ao buscar anúncios, sistema verifica assinatura automaticamente
   - Retorna `isVerified: true/false` em cada anúncio

### Exemplo de uso:

```typescript
// 1. Gerar chaves
POST /api/crypto/generate-keys
{
  "password": "minha-senha-secreta"
}

// 2. Criar anúncio (será assinado automaticamente se tiver chaves)
POST /api/announcements
{
  "content": "Mensagem importante",
  "locationId": "loc123"
}

// 3. Buscar anúncios (verificação automática)
GET /api/announcements
// Resposta inclui: { ..., "isVerified": true }
```

---

## 🔒 3. HTTPS (Opcional)

### Status: Preparado mas não ativado por padrão

O servidor está configurado para suportar HTTPS, mas por padrão roda em HTTP para desenvolvimento.

### Como ativar HTTPS:

1. **Obter certificado SSL:**
   - Produção: Let's Encrypt (gratuito)
   - Desenvolvimento: Certificado auto-assinado

2. **Configurar servidor:**
   ```typescript
   // backend/src/server.ts
   import https from 'https';
   import fs from 'fs';
   
   const options = {
     key: fs.readFileSync('key.pem'),
     cert: fs.readFileSync('cert.pem')
   };
   
   https.createServer(options, app).listen(443);
   ```

3. **Atualizar frontend:**
   ```typescript
   // .env
   EXPO_PUBLIC_API_URL=https://seu-dominio.com/api
   ```

### Nota:
- Para desenvolvimento local, HTTP é suficiente
- Para produção, HTTPS é recomendado
- Certificados auto-assinados geram avisos no navegador

---

## 📊 Resumo das Implementações

### ✅ Mulas (Roteamento de Retransmissão)
- [x] Modelos de dados (MuleConfig, MuleMessage)
- [x] Endpoints para gestão de mulas
- [x] Lógica de eleição de mulas
- [x] Lógica de entrega de mensagens
- [x] Verificação de localização
- [x] Gestão de espaço disponível
- [ ] UI frontend (pendente)

### ✅ Assinaturas Digitais
- [x] Biblioteca de criptografia (RSA 2048-bit)
- [x] Geração de pares de chaves
- [x] Assinatura automática de mensagens
- [x] Verificação automática de assinaturas
- [x] Endpoints para gestão de chaves
- [x] Criptografia de chaves privadas (opcional)
- [ ] UI frontend (pendente)

### ⚠️ HTTPS
- [x] Estrutura preparada
- [ ] Certificado SSL configurado (opcional)
- [ ] Servidor HTTPS ativo (opcional)

---

## 🚀 Próximos Passos (Frontend)

### Para completar a implementação:

1. **UI para Mulas:**
   - Tela de configuração de espaço de mula
   - Lista de mensagens sendo transportadas
   - Botão para entregar mensagens
   - Visualização de mulas disponíveis ao criar anúncio

2. **UI para Assinaturas:**
   - Botão para gerar chaves
   - Indicador visual de mensagens verificadas
   - Configuração de senha para criptografar chave privada

3. **Melhorias:**
   - Notificações quando mula tem mensagens para entregar
   - Dashboard de mulas ativas
   - Estatísticas de mensagens transportadas

---

## 🔧 Migração do Banco de Dados

Para aplicar as mudanças no banco de dados:

```bash
cd backend
npx prisma migrate dev --name add_mules_and_crypto
npx prisma generate
```

Isso criará as novas tabelas:
- `MuleConfig`
- `MuleMessage`
- Campos `publicKey`, `privateKey` em `User`
- Campos `signature`, `publicKey` em `Announcement`

---

## ⚠️ Notas Importantes

1. **Chaves Privadas:**
   - Em produção, chaves privadas devem ser criptografadas
   - Não compartilhar chaves privadas
   - Fazer backup seguro das chaves

2. **Mulas:**
   - Mensagens expiram após 1 hora se não entregues
   - Mula deve estar no mesmo local que publicador e destino
   - Espaço de mula é limitado (configurável)

3. **Assinaturas:**
   - Assinatura inclui conteúdo + autor + timestamp
   - Se conteúdo for modificado, assinatura fica inválida
   - Verificação é automática ao buscar anúncios

---

## ✅ Conclusão

As funcionalidades avançadas foram implementadas no backend:
- ✅ Sistema de Mulas completo
- ✅ Sistema de Assinaturas Digitais completo
- ⚠️ HTTPS preparado (opcional)

O frontend ainda precisa ser atualizado para usar essas funcionalidades, mas toda a lógica de backend está pronta e funcionando.

