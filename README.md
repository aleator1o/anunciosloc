# AnunciosLoc – Frontend (Expo)

Aplicação móvel Expo Router ligada ao backend Node.js/Prisma.

## Pré-requisitos

- Node.js 18+
- Backend a correr em `http://localhost:4000` (ver `backend/README.md`)

## Configuração

1. Instalar dependências

   ```bash
   npm install
   ```

2. Definir a URL da API (opcional)

   Por padrão, usamos `http://127.0.0.1:4000/api` no iOS e `http://10.0.2.2:4000/api` no Android. Para dispositivos físicos ou outra rede, defina `EXPO_PUBLIC_API_URL`:

   ```bash
   # PowerShell (Windows)
   $Env:EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:4000/api"

   # macOS/Linux
   export EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:4000/api"
   ```

3. Iniciar o app

   ```bash
   npx expo start --lan
   ```

   Abra com Expo Go ou um emulador. Certifique-se de que o backend está acessível a partir do dispositivo.

## Funcionalidades

- Autenticação (login/registo) usando o backend Node.js
- Listagem e criação de anúncios
- Listagem e criação de locais (GPS ou WiFi/BLE)
- Perfis com logout
- Swagger disponível no backend em `http://localhost:4000/docs`

## Estrutura

- `app/context/AuthContext.tsx` – estado global de autenticação
- `app/lib/api.ts` – cliente HTTP
- `app/types/api.ts` – tipos partilhados
- `app/home.tsx`, `app/announcements.tsx`, `app/locations.tsx` – ecrãs ligados ao backend

## Comandos úteis

```bash
npx expo start --lan        # iniciar com rede local
npx expo run:android        # build nativa
npx expo start --clear      # limpar cache
```
