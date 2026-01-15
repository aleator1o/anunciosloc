# 🧪 Guia de Teste - Funcionalidade de Mulas

## 📋 Pré-requisitos

1. **Backend rodando** na porta 4000
2. **Frontend rodando** (Expo)
3. **Banco de dados migrado** com as tabelas de mulas
4. **Pelo menos 2 utilizadores** cadastrados
5. **Dispositivos ou emuladores** para simular diferentes utilizadores

---

## 🔧 Passo 1: Preparar o Ambiente

### 1.1. Executar Migração do Banco de Dados

```bash
cd backend
npx prisma migrate dev --name add_mules_and_crypto
npx prisma generate
```

### 1.2. Verificar se as Tabelas Foram Criadas

```bash
# No PostgreSQL ou usando Prisma Studio
npx prisma studio
```

Verifique se existem as tabelas:
- `MuleConfig`
- `MuleMessage`

---

## 👥 Passo 2: Criar Utilizadores de Teste

### 2.1. Criar Utilizador 1 (Publicador)

1. Abra o app no dispositivo/emulador 1
2. Registre-se como:
   - **Username:** `publicador1`
   - **Email:** `publicador1@test.com`
   - **Password:** `123456`

### 2.2. Criar Utilizador 2 (Mula)

1. Abra o app no dispositivo/emulador 2 (ou use outro navegador)
2. Registre-se como:
   - **Username:** `mula1`
   - **Email:** `mula1@test.com`
   - **Password:** `123456`

### 2.3. Criar Utilizador 3 (Destino)

1. Abra o app no dispositivo/emulador 3 (ou use outro navegador)
2. Registre-se como:
   - **Username:** `destino1`
   - **Email:** `destino1@test.com`
   - **Password:** `123456`

---

## 📍 Passo 3: Configurar Localizações

### 3.1. Criar Local para Publicador e Mula

**No dispositivo do Publicador:**
1. Vá em **Locais** → **Criar Local**
2. Crie um local chamado "Local Origem"
3. Configure:
   - **Tipo:** GPS
   - **Raio:** 100 metros
   - **Localização:** Use sua localização atual
   - **Público:** ✅ Sim
   - **Permitir anúncios:** ✅ Sim

**No dispositivo da Mula:**
1. Vá em **Locais** → **Criar Local**
2. Crie o mesmo local "Local Origem" (mesma coordenada GPS)
3. Ou use o local público criado pelo publicador

### 3.2. Criar Local para Destino

**No dispositivo do Destino:**
1. Vá em **Locais** → **Criar Local**
2. Crie um local chamado "Local Destino"
3. Configure:
   - **Tipo:** GPS
   - **Raio:** 100 metros
   - **Localização:** Use uma localização diferente (ou simule)
   - **Público:** ✅ Sim

**No dispositivo da Mula:**
1. Vá em **Locais** → **Criar Local**
2. Crie o mesmo local "Local Destino" (mesma coordenada GPS)

---

## 📦 Passo 4: Configurar Mula

### 4.1. Ativar Função de Mula

**No dispositivo da Mula:**
1. Faça login como `mula1`
2. Vá em **Perfil** → **Funcionalidades Avançadas** → **Mulas**
3. Na aba **Configuração**:
   - ✅ Ative "Ativar função de mula"
   - Configure **Espaço máximo:** `10 MB` (ou mais)
   - Clique em **Salvar Configuração**

**Resultado esperado:**
- Mensagem de sucesso
- Status mostra "✅ Ativo"
- Espaço máximo configurado

---

## 📢 Passo 5: Criar Anúncio

### 5.1. Criar Anúncio no Local Origem

**No dispositivo do Publicador:**
1. Faça login como `publicador1`
2. Vá em **Anúncios** → **+** (botão flutuante)
3. Crie um anúncio:
   - **Conteúdo:** "Mensagem de teste para mula"
   - **Local:** Selecione "Local Origem"
   - **Modo de Entrega:** Centralizada
   - **Política:** Pública (sem restrições)
4. Clique em **Publicar**

**Resultado esperado:**
- Anúncio criado com sucesso
- Anúncio aparece na lista

---

## 🔍 Passo 6: Verificar Mulas Disponíveis

### 6.1. Usar API para Listar Mulas Disponíveis

**Opção 1: Usando Postman ou Insomnia**

```http
GET http://localhost:4000/api/mules/available?announcementId=ID_DO_ANUNCIO
Authorization: Bearer TOKEN_DO_PUBLICADOR
```

**Opção 2: Usando curl**

```bash
curl -X GET "http://localhost:4000/api/mules/available?announcementId=ID_DO_ANUNCIO" \
  -H "Authorization: Bearer TOKEN_DO_PUBLICADOR"
```

**O que verificar:**
- A resposta deve incluir a mula (`mula1`) se:
  - Mula está ativa
  - Mula está no mesmo local que o publicador
  - Mula tem espaço disponível

---

## 📤 Passo 7: Enviar Mensagem via Mula

### 7.1. Enviar via Interface (Recomendado)

**No dispositivo do Publicador:**
1. Vá em **Anúncios** → Clique no anúncio criado
2. Na tela de detalhes, você verá o botão **📦 Enviar via Mula**
3. Clique no botão
4. Na tela de "Enviar via Mula":
   - Clique em **Selecionar Usuário**
   - Escolha o usuário destino (`destino1`)
   - Você verá a lista de mulas disponíveis
   - Clique em **Enviar via esta Mula** na mula desejada
5. Confirme o envio

**Resultado esperado:**
- Mensagem de sucesso
- Mensagem enviada via mula
- Volta para a tela anterior

### 7.2. Enviar via API (Alternativa)

**Usando Postman ou curl:**

```http
POST http://localhost:4000/api/mules/send
Authorization: Bearer TOKEN_DO_PUBLICADOR
Content-Type: application/json

{
  "announcementId": "ID_DO_ANUNCIO",
  "muleUserId": "ID_DO_USUARIO_MULA",
  "destinationUserId": "ID_DO_USUARIO_DESTINO"
}
```

**Onde obter os IDs:**
- `announcementId`: ID do anúncio criado no passo 5
- `muleUserId`: ID do usuário `mula1` (ver no banco ou resposta do login)
- `destinationUserId`: ID do usuário `destino1`

**Resultado esperado:**
- Status 200 OK
- Resposta com `muleMessage` criada
- Status: `PENDING`

---

## 📱 Passo 8: Verificar Mensagem na Mula

### 8.1. Ver Mensagens em Trânsito

**No dispositivo da Mula:**
1. Faça login como `mula1`
2. Vá em **Perfil** → **Mulas** → **Mensagens**
3. Você deve ver:
   - Mensagem "Mensagem de teste para mula"
   - Status: **Pendente**
   - Destino: `destino1`
   - Botão **Entregar Mensagem**

**Resultado esperado:**
- Lista mostra a mensagem em trânsito
- Status correto exibido
- Informações do anúncio e destino visíveis

---

## 🚚 Passo 9: Simular Movimento da Mula

### 9.1. Mula se Move para Local Destino

**No dispositivo da Mula:**
1. Atualize a localização GPS para o "Local Destino"
   - Você pode fazer isso manualmente no código ou
   - Usar a API para atualizar localização:

```http
POST http://localhost:4000/api/presence/location
Authorization: Bearer TOKEN_DA_MULA
Content-Type: application/json

{
  "latitude": LATITUDE_DO_LOCAL_DESTINO,
  "longitude": LONGITUDE_DO_LOCAL_DESTINO
}
```

2. **No dispositivo do Destino:**
   - Também atualize a localização para o "Local Destino"

---

## ✅ Passo 10: Entregar Mensagem

### 10.1. Entregar via Interface

**No dispositivo da Mula:**
1. Vá em **Perfil** → **Mulas** → **Mensagens**
2. Encontre a mensagem em trânsito
3. Clique em **Entregar Mensagem**
4. Confirme a entrega

**Resultado esperado:**
- Mensagem de sucesso
- Status muda para **Entregue**
- Mensagem desaparece da lista (ou aparece como entregue)

### 10.2. Verificar no Destino

**No dispositivo do Destino:**
1. Faça login como `destino1`
2. Vá em **Anúncios** → **Disponíveis**
3. Você deve ver:
   - Anúncio "Mensagem de teste para mula"
   - Badge de verificação (se assinado)
   - Opção para receber

**Resultado esperado:**
- Anúncio aparece na lista de disponíveis
- Pode ser recebido normalmente

---

## 🔍 Passo 11: Verificar no Banco de Dados

### 11.1. Verificar Tabela MuleMessage

```sql
SELECT * FROM "MuleMessage";
```

**O que verificar:**
- `status` deve ser `DELIVERED`
- `deliveredAt` deve ter uma data/hora
- `muleUserId` correto
- `destinationUserId` correto
- `announcementId` correto

### 11.2. Verificar ReceivedAnnouncement

```sql
SELECT * FROM "ReceivedAnnouncement" 
WHERE "userId" = 'ID_DO_DESTINO' 
AND "announcementId" = 'ID_DO_ANUNCIO';
```

**Resultado esperado:**
- Registro criado automaticamente
- `receivedAt` com data/hora

---

## 🧪 Cenários de Teste Adicionais

### Teste 1: Mula sem Espaço Disponível

1. Configure mula com espaço muito pequeno (1 MB)
2. Tente enviar mensagem via mula
3. **Esperado:** Erro "Mula sem espaço disponível"

### Teste 2: Mula Inativa

1. Desative a função de mula
2. Tente listar mulas disponíveis
3. **Esperado:** Mula não aparece na lista

### Teste 3: Mula em Local Diferente

1. Mova a mula para local diferente do publicador
2. Tente listar mulas disponíveis
3. **Esperado:** Mula não aparece (não está no mesmo local)

### Teste 4: Mensagem Expirada

1. Crie mensagem via mula
2. Aguarde mais de 1 hora (ou modifique `expiresAt` no banco)
3. Tente entregar
4. **Esperado:** Mensagem expirada, não pode ser entregue

### Teste 5: Tentar Entregar sem Estar no Local

1. Mula tenta entregar mensagem
2. Mas mula e destino não estão no mesmo local
3. **Esperado:** Erro "Mula e destino devem estar no mesmo local"

---

## 📊 Checklist de Teste

- [ ] Migração do banco executada
- [ ] Utilizadores criados (publicador, mula, destino)
- [ ] Locais criados (origem e destino)
- [ ] Mula configurada e ativada
- [ ] Anúncio criado no local origem
- [ ] Mulas disponíveis listadas corretamente
- [ ] Mensagem enviada via mula
- [ ] Mensagem aparece na lista da mula
- [ ] Mula se move para local destino
- [ ] Mensagem entregue com sucesso
- [ ] Mensagem aparece no destino
- [ ] Status atualizado no banco de dados
- [ ] ReceivedAnnouncement criado

---

## 🐛 Troubleshooting

### Problema: Mula não aparece na lista

**Soluções:**
1. Verificar se mula está ativa (`isActive = true`)
2. Verificar se mula está no mesmo local que publicador
3. Verificar se mula tem espaço disponível
4. Verificar se já não está transportando a mesma mensagem

### Problema: Erro ao entregar mensagem

**Soluções:**
1. Verificar se mula e destino estão no mesmo local
2. Verificar se mensagem não expirou
3. Verificar se status da mensagem é PENDING ou IN_TRANSIT

### Problema: Mensagem não aparece no destino

**Soluções:**
1. Verificar se ReceivedAnnouncement foi criado
2. Verificar se destino está no local correto
3. Verificar políticas do anúncio
4. Verificar janela de tempo (startsAt/endsAt)

---

## 📝 Notas Importantes

1. **Localização:** Para testes, você pode usar coordenadas GPS simuladas ou reais
2. **Tempo:** Mensagens expiram após 1 hora por padrão
3. **Espaço:** Cada mensagem usa aproximadamente 1KB de espaço estimado
4. **Múltiplas Mulas:** Você pode ter várias mulas transportando mensagens diferentes
5. **Status:** Mensagens podem ter status: PENDING, IN_TRANSIT, DELIVERED, EXPIRED

---

## 🎯 Resumo do Fluxo Completo

```
1. Publicador cria anúncio no Local Origem
   ↓
2. Publicador lista mulas disponíveis
   ↓
3. Publicador escolhe mula e envia mensagem
   ↓
4. Mula recebe mensagem (status: PENDING)
   ↓
5. Mula se move para Local Destino
   ↓
6. Mula entrega mensagem (status: DELIVERED)
   ↓
7. Destino recebe anúncio automaticamente
   ↓
8. Destino pode visualizar e receber anúncio
```

---

Este guia cobre todos os passos necessários para testar a funcionalidade de mulas completamente!

