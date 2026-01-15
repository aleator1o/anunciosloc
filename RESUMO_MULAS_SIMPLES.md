# 📦 Resumo Simples - Como Funcionam as Mulas

## ❓ Cada Usuário é uma Mula?

**NÃO!** Cada usuário **pode se tornar** uma mula, mas precisa **ativar manualmente**.

---

## ✅ Quando uma Mula Aparece na Lista?

Uma mula aparece quando **TODAS** estas condições são verdadeiras:

```
┌─────────────────────────────────────────┐
│  1. ✅ Mula está ATIVA                  │
│     (usuário ativou função de mula)    │
├─────────────────────────────────────────┤
│  2. ✅ Mula está no MESMO LOCAL         │
│     (mesmo que o publicador)            │
├─────────────────────────────────────────┤
│  3. ✅ Mula tem ESPAÇO DISPONÍVEL       │
│     (não está cheia)                    │
├─────────────────────────────────────────┤
│  4. ✅ Publicador está no MESMO LOCAL   │
│     (ambos no local do anúncio)         │
└─────────────────────────────────────────┘
```

---

## 🔧 Como Ativar uma Mula (Passo a Passo)

### 1. Login como Usuário que será Mula
```
Exemplo: mula1@test.com
```

### 2. Ir em Perfil → Mulas → Configuração
```
Menu inferior → 👤 Perfil
↓
Role para baixo → "Funcionalidades Avançadas"
↓
Clique em "Mulas"
↓
Aba "Configuração"
```

### 3. Ativar e Salvar
```
✅ Marcar "Ativar função de mula"
📏 Configurar espaço (ex: 10 MB)
💾 Clicar "Salvar Configuração"
```

**Resultado:** Status mostra "✅ Ativo"

---

## 📍 Como Garantir que Mula Está no Local

### Opção 1: Criar Local (Recomendado)
```
1. Mula → Locais → Criar Local
2. Nome: "Local Origem"
3. Tipo: GPS
4. Coordenadas: Mesmas do anúncio
5. Raio: 100 metros
```

### Opção 2: Atualizar Localização
```
1. Mula → Abrir tela "Anúncios"
2. Isso envia localização automaticamente
3. Sistema detecta se está no local
```

---

## 🎯 Exemplo Prático Completo

### Cenário: Publicador quer enviar via mula

**Passo 1: Configurar Mula**
```
Login: mula1@test.com
→ Perfil → Mulas → Configuração
→ ✅ Ativar função de mula
→ Espaço: 10 MB
→ Salvar
```

**Passo 2: Criar Local (Mula)**
```
Login: mula1@test.com
→ Locais → Criar Local
→ Nome: "Local A"
→ GPS: -8.8139, 13.2319
→ Raio: 100m
→ Criar
```

**Passo 3: Criar Local (Publicador)**
```
Login: publicador1@test.com
→ Locais → Criar Local
→ Nome: "Local A"
→ GPS: -8.8139, 13.2319 (MESMAS coordenadas!)
→ Raio: 100m
→ Criar
```

**Passo 4: Criar Anúncio**
```
Login: publicador1@test.com
→ Anúncios → + (criar)
→ Conteúdo: "Teste"
→ Local: Selecionar "Local A"
→ Publicar
```

**Passo 5: Atualizar Localizações**
```
Mula: Abrir tela "Anúncios" (envia localização)
Publicador: Abrir tela "Anúncios" (envia localização)
```

**Passo 6: Enviar via Mula**
```
Publicador → Detalhes do anúncio
→ 📦 Enviar via Mula
→ Selecionar destino
→ ✅ Mulas devem aparecer agora!
```

---

## 🚫 Por que Não Aparecem Mulas?

### Checklist Rápido:

- [ ] **Alguém ativou função de mula?**
  - Não → Outro usuário precisa ativar
  
- [ ] **Mula está no mesmo local?**
  - Não → Criar local com mesmas coordenadas
  
- [ ] **Publicador está no mesmo local?**
  - Não → Criar local com mesmas coordenadas
  
- [ ] **Localizações foram atualizadas?**
  - Não → Abrir tela "Anúncios" em ambos

---

## 💡 Dica Importante

**Localização é CRÍTICA!**

Para mulas aparecerem, **ambos** (publicador e mula) devem estar:
- No **mesmo local** (mesmas coordenadas GPS ou WiFi IDs)
- Com localização **atualizada** (abrir tela Anúncios)

---

## 🔍 Verificar se Está Funcionando

### Via API:

```bash
# 1. Verificar se mula está ativa
GET /api/mules/config
Authorization: Bearer TOKEN_DA_MULA

# Deve retornar: { "config": { "isActive": true } }

# 2. Verificar localização
GET /api/presence/location  
Authorization: Bearer TOKEN_DA_MULA

# Deve retornar: { "latitude": ..., "longitude": ... }

# 3. Listar mulas disponíveis
GET /api/mules/available?announcementId=ID
Authorization: Bearer TOKEN_PUBLICADOR

# Deve retornar: { "mules": [...] }
```

---

## ✅ Resumo Final

**Pergunta:** Cada usuário é uma mula?
**Resposta:** ❌ Não! Precisa ativar manualmente.

**Pergunta:** Quando mula aparece?
**Resposta:** Quando está ativa + mesmo local + espaço disponível.

**Pergunta:** Por que não aparece?
**Resposta:** Verifique se alguém ativou + se estão no mesmo local.

---

**Arquivo completo:** `COMO_FUNCIONAM_MULAS.md` 📚

