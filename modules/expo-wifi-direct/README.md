# Expo WiFi Direct Module

Módulo nativo customizado para WiFi Direct no Expo.

## 📋 Estrutura

```
modules/expo-wifi-direct/
├── src/
│   ├── ExpoWifiDirect.ts    # Interface TypeScript/JavaScript
│   └── index.ts             # Export principal
├── android/
│   └── src/main/java/...    # Implementação Android (Kotlin)
├── app.plugin.js            # Plugin de configuração Expo
├── package.json
└── README.md
```

## 🚀 Uso

```typescript
import ExpoWifiDirect from './modules/expo-wifi-direct/src';

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
}
```

## ⚙️ Build

Para usar este módulo, você precisa fazer um build nativo:

```bash
npx expo prebuild
npx expo run:android
```

## 📚 Documentação Completa

Veja [WIFI_DIRECT_SETUP.md](../../WIFI_DIRECT_SETUP.md) para instruções detalhadas.

