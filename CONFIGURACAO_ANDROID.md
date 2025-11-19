# 🔧 Configuração para Dispositivo Android Físico

## ⚠️ Problema Identificado

Quando você usa um dispositivo Android físico (com Expo Go escaneando QR code), ele não consegue se conectar ao backend usando `10.0.2.2` (que só funciona no emulador). Você precisa usar o **IP local da sua máquina**.

> **💡 Usando Expo Go?** Veja também o guia específico: [EXPO_GO_SETUP.md](./EXPO_GO_SETUP.md)

## ✅ Solução Rápida

### Passo 1: Descobrir o IP da sua máquina

Seu IP na rede local é: **192.168.100.13**

### Passo 2: Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto `anunciosloc` com o seguinte conteúdo:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api
```

### Passo 3: Reiniciar o Expo

```bash
# Parar o Expo (Ctrl+C)
# Depois reiniciar
npm start
```

### Passo 4: Verificar se o Backend está rodando

Certifique-se de que o backend está rodando:

```bash
cd backend
npm run dev
```

Você deve ver:
```
🚀 API a correr na porta 4000
📍 Acesse localmente: http://localhost:4000
🌐 Acesse pela rede: http://SEU_IP:4000
```

### Passo 5: Testar no dispositivo

1. Certifique-se de que o **dispositivo Android e o computador estão na mesma rede WiFi**
2. Abra o app no dispositivo
3. Tente fazer login ou registro
4. Verifique os logs no console do Expo para ver se há erros

## 🔍 Verificações Importantes

### 1. Mesma Rede WiFi
- ✅ Dispositivo Android conectado na mesma WiFi que o computador
- ❌ Não usar dados móveis

### 2. Firewall do Windows
O Windows Firewall pode estar bloqueando a porta 4000. Você precisa:

**Opção A - Permitir porta no Firewall:**
1. Abra "Windows Defender Firewall"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → Próximo
5. TCP → Porta específica: 4000 → Próximo
6. "Permitir a conexão" → Próximo
7. Marque todas as opções → Próximo
8. Nome: "Backend API" → Concluir

**Opção B - Desativar temporariamente:**
- Desative o firewall temporariamente apenas para testes

### 3. Backend Acessível
Teste se consegue acessar o backend do próprio computador:

```bash
curl http://localhost:4000/health
```

E pelo IP da rede:

```bash
curl http://192.168.100.13:4000/health
```

Ambos devem retornar: `{"status":"ok"}`

### 4. Testar no Navegador do Celular
1. Abra o navegador no celular
2. Acesse: `http://192.168.100.13:4000/docs`
3. Se abrir a documentação Swagger, a conexão está funcionando!

## 🐛 Troubleshooting

### Erro: "Não foi possível conectar ao servidor"

**Verifique:**
1. ✅ Backend está rodando? (`npm run dev` no diretório backend)
2. ✅ Arquivo `.env` criado com o IP correto?
3. ✅ Dispositivo e computador na mesma rede WiFi?
4. ✅ Firewall do Windows permitindo a porta 4000?
5. ✅ IP correto? (Execute `ipconfig` novamente se mudou de rede)

### Erro: "Tempo de espera esgotado"

**Possíveis causas:**
- Backend muito lento
- Problema de rede
- Banco de dados não está respondendo

**Solução:**
- Verifique os logs do backend
- Verifique se o banco de dados está acessível

### Ainda não funciona?

1. **Teste no emulador primeiro:**
   - O emulador funciona automaticamente com `10.0.2.2`
   - Se funcionar no emulador, o problema é de rede/configuração

2. **Verifique os logs:**
   - Console do Expo mostra a URL sendo usada
   - Logs do backend mostram se as requisições estão chegando

3. **Teste a conexão manualmente:**
   - Use o navegador do celular para acessar `http://192.168.100.13:4000/docs`
   - Se não abrir, o problema é de rede/firewall

## 📝 Notas

- **Emulador Android**: Usa `10.0.2.2` automaticamente (não precisa configurar)
- **Dispositivo Físico Android**: Precisa configurar `EXPO_PUBLIC_API_URL` com o IP da máquina
- **iOS**: Usa `127.0.0.1` automaticamente (localhost)

## 🔄 Se mudar de rede WiFi

Se você mudar de rede WiFi, o IP pode mudar. Nesse caso:

1. Execute `ipconfig` novamente para descobrir o novo IP
2. Atualize o arquivo `.env` com o novo IP
3. Reinicie o Expo

---

**IP atual da sua máquina:** `192.168.100.13`

**URL da API a configurar:** `http://192.168.100.13:4000/api`

