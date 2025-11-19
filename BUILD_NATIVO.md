# 🏗️ Guia de Build Nativo - WiFi Direct

Para usar WiFi Direct, você precisa fazer um build nativo do app (não funciona com Expo Go).

## 📋 Pré-requisitos

1. **Android Studio** instalado
2. **Java JDK** (versão 17 ou superior)
3. **Android SDK** configurado
4. **Dispositivo Android físico** ou emulador com suporte WiFi Direct

## 🚀 Passos para Build

### 1. Instalar Dependências

```bash
npm install
```

### 2. Gerar Código Nativo

```bash
npx expo prebuild
```

Isso criará as pastas `android/` e `ios/` com o código nativo.

### 3. Build e Executar no Android

```bash
# Opção 1: Build e executar diretamente
npx expo run:android

# Opção 2: Build manual
cd android
./gradlew assembleDebug
# Instalar APK gerado em android/app/build/outputs/apk/debug/
```

### 4. Usar Expo Dev Client

Após o build, você pode usar o Expo Dev Client para desenvolvimento:

```bash
# Iniciar servidor de desenvolvimento
npx expo start --dev-client

# No dispositivo, abra o app Expo Dev Client (não Expo Go)
# Escaneie o QR code
```

## ⚠️ Importante

- **Não use Expo Go** - WiFi Direct requer módulos nativos
- **Use Expo Dev Client** - Permite módulos nativos customizados
- **Teste em dispositivo físico** - WiFi Direct pode não funcionar em emuladores

## 🔧 Troubleshooting

### Erro: "Module not found"
- Execute `npx expo prebuild` novamente
- Limpe o build: `cd android && ./gradlew clean`

### Erro: "Permission denied"
- Verifique permissões no `app.json`
- No Android 13+, adicione `NEARBY_WIFI_DEVICES` manualmente

### WiFi Direct não funciona
- Verifique se o dispositivo suporta WiFi Direct
- Certifique-se de que está usando build nativo (não Expo Go)
- Teste em dispositivo físico (não emulador)

## 📚 Mais Informações

Veja [WIFI_DIRECT_SETUP.md](./WIFI_DIRECT_SETUP.md) para documentação completa do módulo WiFi Direct.

