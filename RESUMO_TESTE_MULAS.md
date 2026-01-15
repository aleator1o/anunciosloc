# 📋 Resumo Rápido - Como Testar Mulas

## 🚀 Teste Rápido (5 minutos)

### 1. Preparar Ambiente
```bash
cd backend
npx prisma migrate dev --name add_mules_and_crypto
```

### 2. Criar 3 Utilizadores
- **Publicador:** `publicador1@test.com`
- **Mula:** `mula1@test.com` 
- **Destino:** `destino1@test.com`

### 3. Configurar Mula
- Login como `mula1`
- **Perfil** → **Mulas** → **Configuração**
- ✅ Ativar função de mula
- Espaço: `10 MB`
- Salvar

### 4. Criar Anúncio
- Login como `publicador1`
- Criar local "Local Origem" (GPS, 100m raio)
- Criar anúncio neste local

### 5. Enviar via Mula
- Abrir detalhes do anúncio
- Clicar **📦 Enviar via Mula**
- Selecionar usuário destino (`destino1`)
- Escolher mula disponível
- Enviar

### 6. Verificar na Mula
- Login como `mula1`
- **Perfil** → **Mulas** → **Mensagens**
- Ver mensagem em trânsito

### 7. Entregar Mensagem
- Mula e destino devem estar no mesmo local
- Na aba **Mensagens**, clicar **Entregar Mensagem**
- Confirmar

### 8. Verificar no Destino
- Login como `destino1`
- **Anúncios** → **Disponíveis**
- Ver anúncio recebido

---

## ✅ Checklist

- [ ] Migração executada
- [ ] 3 utilizadores criados
- [ ] Mula configurada e ativa
- [ ] Anúncio criado
- [ ] Mensagem enviada via mula
- [ ] Mensagem aparece na mula
- [ ] Mensagem entregue
- [ ] Mensagem aparece no destino

---

## 🎯 Fluxo Visual

```
Publicador → Criar Anúncio → Enviar via Mula → Mula recebe
                                                      ↓
Destino ← Mensagem Entregue ← Mula no Local Destino
```

---

## 💡 Dicas

1. **IDs de Usuários:** Use a API `GET /api/users` para obter IDs
2. **Localização:** Para testes, use coordenadas GPS próximas
3. **Múltiplos Testes:** Crie vários anúncios e teste com diferentes mulas
4. **Verificar Banco:** Use `npx prisma studio` para ver dados

---

**Tempo estimado:** 5-10 minutos para teste completo

