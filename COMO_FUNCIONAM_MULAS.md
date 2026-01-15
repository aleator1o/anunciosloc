# 📦 Como Funcionam as Mulas - Guia Completo

## ❓ O que é uma Mula?

Uma **mula** é um dispositivo/usuário que **transporta mensagens** de outros utilizadores. É como um "correio" que leva mensagens de um local para outro.

**IMPORTANTE:** Nem todos os usuários são mulas automaticamente! Cada usuário precisa **ativar a função de mula** manualmente.

---

## ✅ Quando uma Mula está Disponível?

Uma mula aparece na lista de "Mulas Disponíveis" quando **TODAS** estas condições são atendidas:

### 1. ✅ Mula está ATIVA
- O usuário deve ter ativado a função de mula
- Ir em: **Perfil → Mulas → Configuração**
- Marcar: **"Ativar função de mula"** ✅
- Clicar em **Salvar**

### 2. ✅ Mula está no MESMO LOCAL que o Publicador
- Publicador e Mula devem estar no **mesmo local**
- Se o anúncio está no "Local A", a mula também deve estar no "Local A"
- Sistema verifica GPS ou WiFi IDs

### 3. ✅ Mula tem ESPAÇO DISPONÍVEL
- Mula deve ter espaço configurado (padrão: 10MB)
- Espaço não pode estar totalmente ocupado
- Cada mensagem usa aproximadamente 1KB

### 4. ✅ Mula NÃO está transportando a mesma mensagem
- Se a mula já está transportando essa mensagem, não aparece novamente
- Evita duplicatas


### 1. Ideia principal (explicação em linguagem simples)

- **Problema**: Nem sempre o servidor consegue enviar diretamente um anúncio do **User A** para o **User C** (destino), por causa de rede fraca, offline, etc.
- **Solução (Mulas)**: Outro utilizador, o **User B**, funciona como “estafeta digital”:
  - A mensagem vai **A → B → C** em vez de **A → C direto**.
  - O telemóvel da mula guarda a mensagem e entrega quando encontra o destino no local certo.

Papel de cada um:

- **User A (Autor/Publicador)**: cria o anúncio e decide enviar via mula.
- **User B (Mula)**: transporta o anúncio “no bolso” (no seu telemóvel).
- **User C (Destino)**: é quem deve receber o anúncio no fim.

---

### 2. Passos do fluxo (técnico, mas simples)

#### 2.1. Criação e envio via mula (A → B)

1. **A cria o anúncio** num determinado local (Location).
2. No detalhe do anúncio, A:
   - Escolhe **User C** como destino.
   - Vê a lista de **mulas disponíveis** (Users B) — o backend faz:
     - Filtra `MuleConfig.isActive = true` (mulas ativas),
     - Usa `UserLocationStatus` para ver se mula e publicador estão no mesmo local (ou, no mínimo, próximos),
     - Verifica espaço disponível e se essa mula já não está a transportar esse anúncio.
3. Quando A confirma “Enviar via mula”:
   - O backend cria um registo `MuleMessage` com:
     - `announcementId` (qual anúncio),
     - `muleUserId` (quem é a mula B),
     - `destinationUserId` (quem é o destino C),
     - `status = PENDING` (a caminho),
     - `expiresAt` (data de expiração).
   - Isto é a “encomenda” a entrar na mochila da mula.

4. Na app da **mula (B)**:
   - A tela `Mulas` chama `/api/mules/messages`.
   - O backend devolve todas as `MuleMessage` onde `muleUserId = B` e `status = PENDING/IN_TRANSIT`.
   - B vê: “Anúncio X, de A, para entregar a C, no local tal”.

#### 2.2. Transporte e entrega (B → C)

5. B anda fisicamente com o telemóvel (offline/online, não importa muito).
6. Quando B e C estão **no mesmo local** (dentro da Location do anúncio):
   - Ambos têm localização atualizada (tela `Anúncios` atualiza `UserLocationStatus`).
7. A mula B abre a tela `Mulas` e carrega em **“Entregar mensagem”**:
   - O endpoint `/api/mules/deliver`:
     - Confirma que **quem chamou é a mula** (`muleUserId = req.userId`),
     - Se mula ≠ destino:
       - Lê `UserLocationStatus` da mula e do destino,
       - Verifica se estão no mesmo local (`isInsideGeo` ou WiFi/BLE).
     - Se mula = destino (caso especial, como Jael):
       - Não precisa comparar duas localizações diferentes, entrega diretamente.
     - Marca a `MuleMessage` como `DELIVERED`,
     - Cria/atualiza `ReceivedAnnouncement` para o destino C.
8. A partir daqui, para o **User C**:
   - O anúncio passa a contar como **recebido**,
   - Entra no fluxo normal de `available announcements` + notificações.

---

### 3. Componentes principais (para dizer no relatório)

- **Modelos de dados (Prisma)**:
  - `Announcement`: o anúncio em si.
  - `MuleConfig`: configurações da mula (ativo, espaço, userId).
  - `MuleMessage`: ligação entre anúncio, mula e destino (+ estado).
  - `UserLocationStatus`: última localização (lat/lon ou WiFi/BLE) de cada user.
  - `ReceivedAnnouncement`: registo de que um user recebeu um anúncio.

- **Endpoints chave**:
  - `GET /api/mules/list-active`: lista todos os users com mulas ativas.
  - `GET /api/mules/available`: lista mulas disponíveis para um anúncio.
  - `POST /api/mules/send`: cria a `MuleMessage` (A → B).
  - `GET /api/mules/messages`: lista o que a mula está a transportar (para B).
  - `POST /api/mules/deliver`: marca entregue e regista em `ReceivedAnnouncement` (B → C).

---

### 4. Desenho simples da arquitetura (ASCII para apresentar)

Podes pôr algo assim no relatório/slides:

```text
          ┌───────────────────────────┐
          │        Servidor          │
          │  (API + Base de Dados)   │
          │                           │
          │  - Announcement           │
          │  - MuleConfig             │
          │  - MuleMessage            │
          │  - UserLocationStatus     │
          │  - ReceivedAnnouncement   │
          └───────────┬──────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼───────┐ ┌───▼────────┐ ┌──▼──────────┐
│   User A      │ │  User B    │ │  User C     │
│ (Autor)       │ │ (Mula)     │ │ (Destino)   │
│               │ │            │ │             │
│ Cria anúncio  │ │ Recebe     │ │ Recebe      │
│ Envia via     │ │ MuleMessage│ │ Announcement│
│ Mula (→ B,C)  │ │ Transporta │ │ (via Mula)  │
└───────────────┘ └────────────┘ └─────────────┘
```

Fluxo resumido por setas:

```text
1) A cria anúncio
2) A escolhe destino C e mula B
3) A → Servidor: POST /api/mules/send
4) Servidor cria MuleMessage (A → B → C)
5) B → Servidor: GET /api/mules/messages  (vê mensagens para transportar)
6) B e C encontram-se no local
7) B → Servidor: POST /api/mules/deliver
8) Servidor marca DELIVERED + cria ReceivedAnnouncement(C)
9) C passa a ver o anúncio como recebido
```

---

### 5. Como explicar “de maneira mais simples possível”

Frase que podes usar na defesa:

- **“A arquitetura de mulas transforma utilizadores em estafetas digitais: o servidor guarda o anúncio, associa‑o a uma mula e a um destino, o telemóvel da mula transporta o anúncio fisicamente e, quando a mula e o destino se encontram no mesmo local, a mula confirma a entrega e o servidor marca que o destino recebeu aquele anúncio.”**

Se quiseres, posso ainda escrever um parágrafo pronto para colar diretamente no relatório, em português formal.


## 🚫 Por que não aparecem Mulas?

Se você vê "Nenhuma mula disponível", verifique:

### ❌ Problema 1: Nenhum usuário ativou função de mula
**Solução:**
1. Faça login como outro usuário (ex: `mula1`)
2. Vá em **Perfil → Mulas → Configuração**
3. ✅ Ative "Ativar função de mula"
4. Configure espaço (ex: 10 MB)
5. Salve

### ❌ Problema 2: Mula não está no mesmo local
**Solução:**
1. Verifique se o anúncio tem um local associado
2. Verifique se a mula está no mesmo local:
   - **GPS:** Mesmas coordenadas (dentro do raio)
   - **WiFi:** Mesmos WiFi IDs detectados
3. Atualize a localização da mula:
   - Abra o app da mula
   - Vá em **Anúncios** (isso envia localização automaticamente)
   - Ou use API: `POST /api/presence/location`

### ❌ Problema 3: Mula sem espaço
**Solução:**
1. Vá em **Perfil → Mulas → Mensagens**
2. Veja quantas mensagens estão em trânsito
3. Se muitas, entregue algumas ou aumente o espaço máximo

### ❌ Problema 4: Publicador não está no local do anúncio
**Solução:**
1. O publicador também deve estar no local do anúncio
2. Sistema verifica se ambos (publicador e mula) estão no mesmo local
3. Atualize localização do publicador também

---

## 🔧 Como Configurar uma Mula (Passo a Passo)

### Passo 1: Criar Usuário Mula

1. Registre um novo usuário (ex: `mula1@test.com`)
2. Faça login

### Passo 2: Ativar Função de Mula

1. Vá em **Perfil** (ícone 👤 no menu inferior)
2. Role para baixo até **"Funcionalidades Avançadas"**
3. Clique em **"Mulas"**
4. Na aba **"Configuração"**:
   - ✅ Marque **"Ativar função de mula"**
   - Configure **Espaço máximo:** `10` MB (ou mais)
   - Clique em **"Salvar Configuração"**

**Resultado esperado:**
- Mensagem: "Configuração salva com sucesso"
- Status mostra: "✅ Ativo"

### Passo 3: Garantir que Mula está no Local

1. Vá em **Locais** → **Criar Local**
2. Crie um local chamado "Local Origem"
3. Use coordenadas GPS ou WiFi IDs
4. Abra a tela **Anúncios** (isso envia localização automaticamente)

---

## 🧪 Teste Completo - Verificar se Mula Está Disponível

### Teste 1: Verificar Configuração da Mula

```bash
# Via API (substitua TOKEN_DA_MULA)
GET http://localhost:4000/api/mules/config
Authorization: Bearer TOKEN_DA_MULA
```

**Esperado:**
```json
{
  "config": {
    "isActive": true,
    "maxSpaceBytes": 10485760
  }
}
```

### Teste 2: Verificar Localização da Mula

```bash
# Via API
GET http://localhost:4000/api/presence/location
Authorization: Bearer TOKEN_DA_MULA
```

**Esperado:**
- Deve retornar latitude/longitude ou wifiIds

### Teste 3: Verificar Mulas Disponíveis

```bash
# Via API (substitua ID_DO_ANUNCIO e TOKEN_DO_PUBLICADOR)
GET http://localhost:4000/api/mules/available?announcementId=ID_DO_ANUNCIO
Authorization: Bearer TOKEN_DO_PUBLICADOR
```

**Esperado:**
```json
{
  "mules": [
    {
      "userId": "id-da-mula",
      "username": "mula1",
      "availableSpaceBytes": 10485760,
      "maxSpaceBytes": 10485760
    }
  ]
}
```

---

## 📋 Checklist: Mula Disponível?

Para uma mula aparecer na lista, verifique:

- [ ] Usuário existe no sistema
- [ ] Usuário fez login como mula
- [ ] Função de mula está **ATIVA** (isActive = true)
- [ ] Espaço máximo configurado (> 0)
- [ ] Mula está no **mesmo local** que o anúncio
- [ ] Publicador está no **mesmo local** que o anúncio
- [ ] Mula tem espaço disponível (não está cheia)
- [ ] Mula não está transportando a mesma mensagem já

---

## 🎯 Exemplo Prático

### Cenário: Publicador quer enviar mensagem via mula

**Situação:**
- Publicador: `publicador1` criou anúncio no "Local A"
- Mula: `mula1` está configurada mas não aparece na lista

**Diagnóstico:**

1. **Verificar se mula está ativa:**
   ```
   Login como mula1 → Perfil → Mulas → Configuração
   ✅ Deve estar marcado "Ativar função de mula"
   ```

2. **Verificar se mula está no Local A:**
   ```
   Login como mula1 → Locais → Criar Local "Local A"
   (mesmas coordenadas do anúncio)
   ```

3. **Verificar se publicador está no Local A:**
   ```
   Login como publicador1 → Locais → Criar Local "Local A"
   (mesmas coordenadas)
   ```

4. **Atualizar localizações:**
   ```
   Ambos devem abrir a tela "Anúncios"
   (isso envia localização automaticamente)
   ```

5. **Tentar novamente:**
   ```
   Publicador → Detalhes do anúncio → Enviar via Mula
   → Selecionar destino → Mulas devem aparecer!
   ```

---

## 💡 Dicas Importantes

1. **Cada usuário é uma mula potencial**, mas precisa ativar manualmente
2. **Mulas não são automáticas** - usuário decide se quer ser mula
3. **Localização é crítica** - ambos devem estar no mesmo local
4. **Espaço é limitado** - mula pode recusar se estiver cheia
5. **Uma mula pode transportar várias mensagens** diferentes

---

## 🔍 Debug: Por que minha mula não aparece?

### Verificar no Banco de Dados:

```sql
-- Verificar se mula está configurada
SELECT * FROM "MuleConfig" WHERE "userId" = 'ID_DA_MULA';

-- Deve retornar:
-- isActive: true
-- maxSpaceBytes: > 0

-- Verificar localização da mula
SELECT * FROM "UserLocationStatus" WHERE "userId" = 'ID_DA_MULA';

-- Verificar localização do publicador
SELECT * FROM "UserLocationStatus" WHERE "userId" = 'ID_DO_PUBLICADOR';

-- Verificar local do anúncio
SELECT * FROM "Location" WHERE "id" = 'ID_DO_LOCAL_DO_ANUNCIO';
```

### Verificar Logs do Backend:

Quando você chama `GET /api/mules/available`, o backend deve mostrar no console:
- Quantas mulas foram encontradas
- Por que cada mula foi filtrada (se não apareceu)

---

## ✅ Resumo

**Pergunta:** Cada usuário é uma mula?
**Resposta:** Não! Cada usuário **pode se tornar** uma mula, mas precisa:
1. Ativar a função manualmente
2. Configurar espaço disponível
3. Estar no local correto

**Pergunta:** Quando uma mula está disponível?
**Resposta:** Quando:
- ✅ Está ativa
- ✅ Está no mesmo local que o publicador
- ✅ Tem espaço disponível
- ✅ Não está transportando a mesma mensagem

**Pergunta:** Por que não aparecem mulas?
**Resposta:** Verifique:
- Alguém ativou função de mula?
- Mula está no mesmo local?
- Publicador está no mesmo local?
- Mula tem espaço?

---

Este guia deve ajudar a entender e resolver problemas com mulas! 🚀
