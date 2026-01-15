# 🌐 Como Iniciar o Expo com IP da Rede Local

O Expo precisa usar o IP da rede local (192.168.100.13) para que dispositivos físicos possam se conectar.

## Método 1: Usando o script configurado

```bash
npm start
```

Se ainda mostrar `127.0.0.1`, pare o Expo (Ctrl+C) e execute:

```bash
npm run start:network
```

## Método 2: Forçar IP específico manualmente

```bash
npx expo start --lan --host 192.168.100.13
```

## Método 3: Se o --lan não funcionar

1. Inicie o Expo normalmente:
   ```bash
   npm start
   ```

2. Quando o menu aparecer, pressione `s` para mudar para modo LAN

3. Ou pressione `r` para reiniciar e selecionar a opção LAN

## Verificar IP da sua máquina

Se o IP mudou (mudou de rede WiFi), descubra o novo IP:

```powershell
ipconfig | findstr /i "IPv4"
```

Depois atualize o script `start:network` no `package.json` com o novo IP.

## Solução de Problemas

### Expo ainda mostra 127.0.0.1

1. Pare o Expo (Ctrl+C)
2. Limpe o cache:
   ```bash
   npx expo start --clear
   ```
3. Execute novamente com `--lan`:
   ```bash
   npm start
   ```

### Dispositivo não conecta

1. Verifique se o dispositivo e computador estão na mesma rede WiFi
2. Verifique se o firewall do Windows não está bloqueando a porta 8081
3. Tente usar o QR code que aparece no terminal com o IP `192.168.100.13:8081`

## Configuração no app.json (Opcional)

Você também pode configurar no `app.json`:

```json
{
  "expo": {
    "extra": {
      "host": "192.168.100.13"
    }
  }
}
```

Mas geralmente o `--lan` é suficiente.

