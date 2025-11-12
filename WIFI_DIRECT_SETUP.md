# 📡 Configuração WiFi Direct - AnunciosLoc

Este guia explica como configurar e usar WiFi Direct no projeto AnunciosLoc.

## 📋 Pré-requisitos

1. **expo-dev-client** instalado (já incluído)
2. **Build nativo** do app (não funciona com Expo Go)
3. **Dispositivo Android físico** ou emulador com suporte WiFi Direct
4. **Permissões** configuradas no `app.json`

## 🚀 Configuração

### 1. Build do App com Dev Client

Como o WiFi Direct requer módulos nativos, você precisa fazer um build nativo:

```bash
# Para Android
npx expo run:android

# Ou criar um build de desenvolvimento
npx expo prebuild
npx expo run:android
```

### 2. Permissões

As permissões já estão configuradas no `app.json`:

- `ACCESS_WIFI_STATE`
- `CHANGE_WIFI_STATE`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `CHANGE_NETWORK_STATE`
- `INTERNET`
- `ACCESS_NETWORK_STATE`

**Nota:** No Android 13+ (API 33+), também é necessário `NEARBY_WIFI_DEVICES`.

### 3. Módulo Nativo

O módulo nativo `expo-wifi-direct` está localizado em:
- `modules/expo-wifi-direct/`

## 🔧 Como Funciona

### Estrutura do Módulo

```
modules/expo-wifi-direct/
├── src/
│   ├── ExpoWifiDirect.ts    # Interface TypeScript
│   └── index.ts             # Export principal
├── android/
│   └── src/main/java/...    # Implementação Android (Kotlin)
└── package.json
```

### Funcionalidades Implementadas

1. **Descoberta de Peers**
   - `discoverPeers()` - Inicia descoberta
   - `getPeers()` - Lista dispositivos encontrados
   - Eventos: `onPeerDiscovered`

2. **Conexão**
   - `connect(deviceAddress)` - Conecta a um peer
   - `disconnect(deviceAddress)` - Desconecta
   - Eventos: `onConnectionChanged`

3. **Envio/Recebimento de Dados**
   - `sendData(deviceAddress, data)` - Envia dados
   - Eventos: `onDataReceived`

4. **Utilitários**
   - `isSupported()` - Verifica suporte
   - `isEnabled()` - Verifica se está habilitado
   - `getCurrentSSID()` - Obtém SSID atual

## 📱 Uso no App

O serviço P2P (`app/lib/p2pService.ts`) já está integrado e usa automaticamente o módulo nativo quando disponível.

### Exemplo de Uso Direto

```typescript
import ExpoWifiDirect from './modules/expo-wifi-direct';

// Verificar suporte
if (ExpoWifiDirect.isSupported()) {
  // Habilitar
  await ExpoWifiDirect.enable();
  
  // Descobrir peers
  await ExpoWifiDirect.discoverPeers();
  
  // Obter lista
  const peers = await ExpoWifiDirect.getPeers();
  
  // Conectar
  await ExpoWifiDirect.connect(peers[0].deviceAddress);
  
  // Enviar dados
  await ExpoWifiDirect.sendData(peers[0].deviceAddress, JSON.stringify({ message: 'Hello' }));
  
  // Listener para dados recebidos
  ExpoWifiDirect.addDataReceivedListener((data) => {
    console.log('Dados recebidos:', data);
  });
}
```

## ⚠️ Limitações

1. **Expo Go**: Não funciona - requer build nativo
2. **iOS**: Não implementado (WiFi Direct é principalmente Android)
3. **Emulador**: WiFi Direct pode não funcionar em todos os emuladores
4. **Permissões**: Android 13+ requer permissões adicionais

## 🐛 Troubleshooting

### "WiFi Direct not supported"
- Verifique se o dispositivo suporta WiFi Direct
- Certifique-se de que está usando build nativo (não Expo Go)

### "Permission denied"
- Verifique permissões no `app.json`
- No Android 13+, adicione `NEARBY_WIFI_DEVICES` manualmente no `AndroidManifest.xml`

### "Channel not initialized"
- O módulo precisa ser inicializado corretamente
- Verifique se `expo-dev-client` está configurado

### Dispositivos não aparecem
- Certifique-se de que WiFi Direct está habilitado no dispositivo
- Verifique se ambos os dispositivos estão próximos
- Tente reiniciar a descoberta

## 🔄 Alternativas

Se o módulo nativo não funcionar, o serviço P2P tem fallback para:
1. **react-native-wifi-reborn** (se instalado)
2. **Modo simulado** (para desenvolvimento)

## 📚 Referências

- [Android WiFi Direct Documentation](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/)
- [expo-dev-client](https://docs.expo.dev/clients/introduction/)

## 🎯 Próximos Passos

1. Testar em dispositivo físico Android
2. Implementar envio/recebimento de dados via sockets
3. Adicionar suporte iOS (se necessário)
4. Melhorar tratamento de erros
5. Adicionar testes

