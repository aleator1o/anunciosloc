# Como Configurar a Conexão com o Backend no Android

## Problema
Ao usar um dispositivo Android físico, o app não consegue se conectar ao backend que está rodando no seu computador.

## Solução

### 1. Descobrir o IP da sua máquina

**Windows:**
```bash
ipconfig
```
Procure por "IPv4 Address" na interface da sua rede WiFi. Exemplo: `192.168.1.100`

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr
```

### 2. Configurar a URL da API no Expo

Crie um arquivo `.env` na raiz do projeto `anunciosloc` com:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_AQUI:4000/api
```

Exemplo:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:4000/api
```

### 3. Verificar se o Backend está acessível

O backend precisa estar rodando e acessível na sua rede local:

1. Certifique-se de que o backend está rodando:
   ```bash
   cd backend
   npm run dev
   ```

2. Teste se consegue acessar do seu computador:
   ```bash
   curl http://localhost:4000/health
   ```

3. Teste se consegue acessar pelo IP da rede:
   ```bash
   curl http://SEU_IP:4000/health
   ```

### 4. Verificar Firewall

O Windows Firewall pode estar bloqueando a porta 4000. Você precisa:

1. Abrir o Windows Defender Firewall
2. Permitir conexões na porta 4000
3. Ou desativar temporariamente o firewall para testes

### 5. Verificar Rede WiFi

- O dispositivo Android e o computador devem estar na **mesma rede WiFi**
- Não use dados móveis no celular
- Algumas redes públicas podem bloquear conexões entre dispositivos

### 6. Reiniciar o Expo

Após criar o arquivo `.env`, reinicie o Expo:

```bash
# Parar o Expo (Ctrl+C)
# Depois reiniciar
npm start
```

## Testando a Conexão

1. Abra o app no dispositivo Android
2. Tente fazer login ou registro
3. Verifique os logs no console do Expo para ver a URL sendo usada
4. Se houver erro, verifique a mensagem de erro que agora mostra instruções detalhadas

## Troubleshooting

### Erro: "Não foi possível conectar ao servidor"

- Verifique se o backend está rodando
- Verifique se o IP está correto no arquivo `.env`
- Verifique se o dispositivo e computador estão na mesma rede WiFi
- Verifique o firewall do Windows

### Erro: "Tempo de espera esgotado"

- O backend pode estar lento ou não respondendo
- Verifique os logs do backend
- Verifique se o banco de dados está acessível

### Ainda não funciona?

1. Teste no emulador Android primeiro (usa `10.0.2.2` automaticamente)
2. Verifique os logs do backend para ver se as requisições estão chegando
3. Tente acessar `http://SEU_IP:4000/docs` no navegador do celular para testar a conexão

## Notas

- Para **emulador Android**: Não precisa configurar nada, funciona automaticamente com `10.0.2.2`
- Para **dispositivo físico Android**: Precisa configurar `EXPO_PUBLIC_API_URL` com o IP da máquina
- Para **iOS**: Usa `127.0.0.1` automaticamente (localhost)


