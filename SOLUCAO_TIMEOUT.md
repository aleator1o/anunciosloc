# 🔧 Solução para Erro de Timeout na Conexão

## ❌ Problema

Você está vendo este erro:
```
ERROR [API] Timeout na requisição
ERROR [AuthContext] Erro no login: Tempo de espera esgotado
```

O app está tentando conectar a `http://10.0.2.2:4000/api` (IP de emulador), mas você está usando:
- ✅ Dispositivo físico Android, OU
- ✅ Expo Go (QR Code)

## ✅ Solução Rápida

### Passo 1: Criar arquivo `.env`

Na raiz do projeto `anunciosloc` (mesmo nível que `package.json`), crie um arquivo chamado `.env` com este conteúdo:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.13:4000/api
```

**⚠️ IMPORTANTE:** Substitua `192.168.100.13` pelo IP da sua máquina se for diferente!

Para descobrir seu IP:
- **Windows:** `ipconfig | findstr /i "IPv4"`
- **Linux/Mac:** `ifconfig` ou `ip addr`

### Passo 2: Reiniciar o Expo

1. Pare o Expo (pressione `Ctrl+C` no terminal)
2. Inicie novamente:
   ```bash
   npm start
   ```
   ou
   ```bash
   npx expo start --lan
   ```

### Passo 3: Recarregar o App

No dispositivo ou Expo Go, recarregue o app (shake e "Reload" ou feche e abra novamente).

## 🔍 Verificação

Após criar o `.env` e reiniciar, você deve ver no console:

```
[API] ========================================
[API] URL base configurada: http://192.168.100.13:4000/api
[API] Platform: android
[API] EXPO_PUBLIC_API_URL configurado: ✅ SIM
[API] ========================================
```

Se ainda aparecer `❌ NÃO`, o arquivo `.env` não foi carregado. Verifique:
- ✅ O arquivo está na raiz do projeto (não dentro de `app/` ou `backend/`)
- ✅ O nome do arquivo é exatamente `.env` (sem extensão)
- ✅ Você reiniciou o Expo após criar o arquivo

## 📝 Estrutura de Arquivos

```
anunciosloc/
├── .env                    ← CRIE ESTE ARQUIVO AQUI
├── .env.example            ← Arquivo de exemplo
├── app/
├── backend/
├── package.json
└── ...
```

## 🆘 Ainda com Problemas?

1. **Verifique se o backend está rodando:**
   ```bash
   cd backend
   npm run dev
   ```
   Você deve ver: `🚀 API a correr na porta 4000`

2. **Teste a conexão manualmente:**
   - No navegador do celular, acesse: `http://192.168.100.13:4000/api/health`
   - Se não abrir, verifique firewall e rede WiFi

3. **Verifique se está na mesma rede WiFi:**
   - Computador e celular devem estar na mesma rede WiFi

4. **Verifique o firewall do Windows:**
   - A porta 4000 deve estar aberta para conexões de entrada

## 📚 Mais Informações

Veja também:
- `EXPO_GO_SETUP.md` - Guia completo para Expo Go
- `CONFIGURACAO_ANDROID.md` - Configuração para Android

