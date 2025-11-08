# 📱 Configuração para Expo Go (QR Code)

Este guia é específico para usar o **Expo Go** no dispositivo Android físico escaneando o QR code.

## 🎯 Entendendo o Fluxo

Quando você usa o Expo Go:

1. **Metro Bundler** (no computador) serve o app via rede local
2. **Expo Go** (no celular) escaneia o QR code e se conecta ao Metro Bundler
3. O app carrega no Expo Go
4. Quando o app faz requisições HTTP para o backend, essas requisições **saem do celular físico**
5. Por isso, você precisa usar o **IP local da sua máquina** para acessar o backend

## ✅ Configuração Passo a Passo

### Passo 1: Verificar IP da sua máquina

Seu IP atual: **192.168.100.13**

Para verificar novamente:
```bash
ipconfig | findstr /i "IPv4"
```

### Passo 2: Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto `anunciosloc`:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api
```

### Passo 3: Iniciar o Backend

Em um terminal, inicie o backend:

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

### Passo 4: Iniciar o Expo com LAN

**IMPORTANTE:** Use o comando `--lan` para garantir que o Metro Bundler seja acessível pela rede:

```bash
npm start
```

Ou explicitamente:

```bash
npx expo start --lan
```

O `--lan` garante que o QR code seja acessível pela rede local, não apenas por localhost.

### Passo 5: Escanear o QR Code

1. Abra o **Expo Go** no seu dispositivo Android
2. Escaneie o QR code que aparece no terminal
3. O app deve carregar no Expo Go

### Passo 6: Verificar Conexão

1. Tente fazer login ou registro no app
2. Verifique os logs no terminal do Expo para ver se há erros
3. Verifique os logs do backend para ver se as requisições estão chegando

## 🔍 Verificações Importantes

### 1. Mesma Rede WiFi

✅ **CRÍTICO:** O dispositivo Android e o computador devem estar na **mesma rede WiFi**

- ❌ Não use dados móveis no celular
- ✅ Conecte ambos na mesma rede WiFi
- ✅ Se mudar de rede, atualize o IP no arquivo `.env`

### 2. Firewall do Windows

O Windows Firewall pode estar bloqueando a porta 4000.

**Solução rápida - Permitir porta 4000:**

1. Abra "Windows Defender Firewall"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → Próximo
5. TCP → Porta específica: **4000** → Próximo
6. "Permitir a conexão" → Próximo
7. Marque todas as opções (Domínio, Privado, Público) → Próximo
8. Nome: "Backend API Port 4000" → Concluir

### 3. Testar Conexão Manualmente

No navegador do celular, acesse:

```
http://192.168.100.13:4000/docs
```

Se abrir a documentação Swagger, a conexão está funcionando! ✅

Se não abrir, verifique:
- Backend está rodando?
- Firewall permitindo a porta 4000?
- Dispositivo e computador na mesma rede WiFi?

## 🐛 Troubleshooting

### Problema: App não carrega no Expo Go

**Solução:**
- Verifique se está usando `npm start` (que agora usa `--lan` automaticamente)
- Certifique-se de que o dispositivo e computador estão na mesma rede WiFi
- Tente reiniciar o Expo: `npx expo start --lan --clear`

### Problema: "Não foi possível conectar ao servidor" no login/registro

**Verifique:**
1. ✅ Backend está rodando? (`npm run dev` no diretório backend)
2. ✅ Arquivo `.env` criado com o IP correto?
3. ✅ IP correto? (Execute `ipconfig` novamente se mudou de rede)
4. ✅ Firewall permitindo a porta 4000?
5. ✅ Dispositivo e computador na mesma rede WiFi?

### Problema: "Tempo de espera esgotado"

**Possíveis causas:**
- Backend muito lento ou não respondendo
- Problema de rede
- Banco de dados não está acessível

**Solução:**
- Verifique os logs do backend
- Verifique se o banco de dados está rodando
- Teste acessar `http://192.168.100.13:4000/health` no navegador do celular

### Problema: Expo Go não encontra o Metro Bundler

**Solução:**
- Certifique-se de usar `npm start` (com `--lan`)
- Verifique se o firewall não está bloqueando a porta do Metro Bundler (geralmente 8081)
- Tente conectar manualmente no Expo Go digitando: `exp://192.168.100.13:8081`

## 📝 Resumo dos Comandos

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Expo (Frontend)
cd anunciosloc
npm start  # Usa --lan automaticamente
```

## 🔄 Se mudar de rede WiFi

Se você mudar de rede WiFi, o IP pode mudar:

1. Execute `ipconfig` novamente para descobrir o novo IP
2. Atualize o arquivo `.env` com o novo IP
3. Reinicie o Expo: `npm start`

## ✅ Checklist Final

Antes de testar, certifique-se de que:

- [ ] Backend está rodando (`npm run dev` no diretório backend)
- [ ] Arquivo `.env` criado com `EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api`
- [ ] Expo iniciado com `npm start` (usa `--lan` automaticamente)
- [ ] Dispositivo Android e computador na mesma rede WiFi
- [ ] Firewall do Windows permitindo a porta 4000
- [ ] Testou acessar `http://192.168.100.13:4000/docs` no navegador do celular

---

**IP atual da sua máquina:** `192.168.100.13`

**URL da API:** `http://192.168.100.13:4000/api`

**Comando para iniciar:** `npm start` (usa `--lan` automaticamente)

