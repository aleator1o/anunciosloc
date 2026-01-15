# 📡 Arquitetura de Envio de Anúncios e Mensagens - AnunciosLoc

## 📋 Visão Geral

O sistema AnunciosLoc implementa **duas arquiteturas de entrega** de mensagens:

1. **Modo Centralizado (CENTRALIZED)** - Mensagens via servidor
2. **Modo Descentralizado (DECENTRALIZED)** - Mensagens via WiFi Direct P2P

---

## 🌐 Modo Centralizado (CENTRALIZED)

### Fluxo de Publicação de Mensagem

```
┌─────────────────┐
│   Publicador    │
│   (Dispositivo) │
└────────┬────────┘
         │
         │ 1. POST /api/announcements
         │    {
         │      content: "Mensagem",
         │      locationId: "uuid",
         │      deliveryMode: "CENTRALIZED",
         │      policyType: "WHITELIST",
         │      policyRestrictions: [...]
         │    }
         ▼
┌─────────────────┐
│  Backend Server │
│   (Node.js)     │
│  Porta 4000     │
└────────┬────────┘
         │
         │ 2. Salvar no PostgreSQL
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
│   - Announcement│
│   - Location    │
│   - UserProfile │
└─────────────────┘
```

### Fluxo de Recebimento de Mensagem

```
┌─────────────────┐
│   Receptor      │
│   (Dispositivo) │
└────────┬────────┘
         │
         │ 1. Localização GPS/WiFi
         │    enviada a cada 30s
         │    POST /api/presence/location
         ▼
┌─────────────────┐
│  Backend Server │
│   (Node.js)     │
└────────┬────────┘
         │
         │ 2. GET /api/announcements/available
         │    (aplica filtros: localização, políticas, tempo)
         │
         │ Filtros aplicados:
         │ - Localização: GPS (raio) ou WiFi IDs
         │ - Janela de tempo: startsAt, endsAt
         │ - Políticas: Whitelist/Blacklist + perfil do usuário
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│   (Query com    │
│    filtros)     │
└────────┬────────┘
         │
         │ 3. Retorna apenas mensagens disponíveis
         ▼
┌─────────────────┐
│   Receptor      │
│   (Dispositivo) │
│   - Mostra na   │
│     aba         │
│     "Disponíveis"│
│   - Badge com   │
│     contador    │
└─────────────────┘
         │
         │ 4. POST /api/announcements/:id/receive
         │    (marca como recebida)
         ▼
┌─────────────────┐
│  Backend Server │
│   - Salva em    │
│   ReceivedAnnouncement│
└─────────────────┘
```

### Sistema de Localização no Modo Centralizado

```
┌─────────────────────────────────────────┐
│      Dispositivo (Frontend)             │
│                                         │
│  1. LocationService                     │
│     - Obtém GPS (expo-location)        │
│     - Obtém WiFi IDs (simulado/nativo) │
│                                         │
│  2. Envia localização a cada 30s:      │
│     POST /api/presence/location        │
│     {                                   │
│       latitude: -8.8139,               │
│       longitude: 13.2319,              │
│       wifiIds: ["SSID1", "SSID2"]     │
│     }                                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Backend Server                     │
│                                         │
│  1. Recebe localização                  │
│  2. Atualiza UserLocationStatus        │
│  3. Armazena no PostgreSQL:            │
│     - userId (chave primária)          │
│     - latitude, longitude              │
│     - wifiIds (array)                  │
│     - updatedAt                        │
└─────────────────────────────────────────┘
```

### Sistema de Filtragem no Modo Centralizado

```
┌─────────────────────────────────────────────────┐
│         GET /api/announcements/available        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Buscar todos os       │
        │  anúncios do banco     │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Aplicar Filtros:      │
        │                        │
        │  1. Janela de Tempo    │
        │     - startsAt < now   │
        │     - endsAt > now     │
        │                        │
        │  2. Localização        │
        │     - GPS: dentro do   │
        │       raio?            │
        │     - WiFi: IDs        │
        │       coincidem?       │
        │                        │
        │  3. Políticas          │
        │     - Whitelist:       │
        │       perfil           │
        │       corresponde?     │
        │     - Blacklist:       │
        │       perfil NÃO       │
        │       corresponde?     │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Retornar apenas       │
        │  mensagens que passam  │
        │  em todos os filtros   │
        └────────────────────────┘
```

---

## 📡 Modo Descentralizado (DECENTRALIZED) - WiFi Direct P2P

### Fluxo de Publicação P2P

```
┌─────────────────────────────────────────────┐
│         Publicador (Dispositivo A)          │
│                                             │
│  1. Cria anúncio com deliveryMode:         │
│     "DECENTRALIZED"                        │
│                                             │
│  2. Backend salva no banco (para           │
│     sincronização entre dispositivos)      │
│                                             │
│  3. P2PService adiciona ao cache local:   │
│     localAnnouncements Map                 │
│                                             │
│  4. P2PService.startPublishing():         │
│     - Verifica localização periodicamente │
│     - Quando no local de destino:         │
│       a) Escaneia dispositivos próximos   │
│       b) Para cada dispositivo:           │
│          - Solicita perfil (se necessário)│
│          - Verifica política              │
│          - Envia mensagem se corresponder │
└────────────┬────────────────────────────────┘
             │
             │ WiFi Direct
             │ (P2P)
             ▼
┌─────────────────────────────────────────────┐
│         Receptor (Dispositivo B)            │
│                                             │
│  1. P2PService escuta mensagens:          │
│     - Recebe mensagem via WiFi Direct      │
│                                             │
│  2. Verifica política:                     │
│     - Compara perfil do receptor com       │
│       policyRestrictions                   │
│     - Whitelist: deve corresponder         │
│     - Blacklist: NÃO deve corresponder     │
│                                             │
│  3. Se passar na política:                 │
│     - Adiciona a receivedAnnouncements     │
│     - Mostra na aba "P2P"                  │
│     - NÃO encaminha (apenas mostra)        │
└─────────────────────────────────────────────┘
```

### Arquitetura P2P Detalhada

```
┌──────────────────────────────────────────────────────────┐
│               Publicador (Dispositivo A)                 │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         Cache Local (P2PService)          │        │
│  │                                            │        │
│  │  localAnnouncements: Map<string, Announcement>│    │
│  │  - Armazena mensagens descentralizadas    │        │
│  │  - Persistente durante sessão do app      │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
│               │ Loop de Publicação (a cada 10s)       │
│               ▼                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  1. Verificar Localização                 │        │
│  │     POST /api/announcements/:id/          │        │
│  │            verify-location                │        │
│  │                                            │        │
│  │     Se estiver no local de destino:       │        │
│  │       - Continuar para passo 2            │        │
│  │     Senão:                                 │        │
│  │       - Aguardar próximo ciclo            │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
│               ▼                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  2. Escanear Dispositivos Próximos        │        │
│  │     - WiFi Direct Discovery               │        │
│  │     - Lista de dispositivos descobertos   │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
│               ▼                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  3. Para Cada Dispositivo:                │        │
│  │                                            │        │
│  │     a) Se perfil não conhecido:           │        │
│  │        - Enviar PROFILE_REQUEST           │        │
│  │        - Aguardar PROFILE_RESPONSE        │        │
│  │                                            │        │
│  │     b) Verificar Política:                │        │
│  │        - Comparar perfil do dispositivo   │        │
│  │          com policyRestrictions           │        │
│  │        - Whitelist: todas correspondem?   │        │
│  │        - Blacklist: nenhuma corresponde?  │        │
│  │                                            │        │
│  │     c) Se passar na política:             │        │
│  │        - Enviar mensagem via WiFi Direct  │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
│               │ WiFi Direct Send                       │
│               ▼                                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               Receptor (Dispositivo B)                   │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │      Listener (P2PService)                │        │
│  │                                            │        │
│  │  - Escuta mensagens via WiFi Direct        │        │
│  │  - Recebe mensagens periodicamente         │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
│               ▼                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  Para Cada Mensagem Recebida:             │        │
│  │                                            │        │
│  │  1. Verificar se já recebeu (evitar dup)  │        │
│  │  2. Verificar Política:                   │        │
│  │     - Comparar próprio perfil com         │        │
│  │       policyRestrictions                  │        │
│  │  3. Se passar na política:                │        │
│  │     - Adicionar a receivedAnnouncements   │        │
│  │     - Mostrar na aba "P2P"                │        │
│  │     - NÃO encaminhar para outros          │        │
│  └────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Completo de uma Mensagem

### Cenário 1: Modo Centralizado

```
┌──────────────┐
│ Publicador   │
│ 1. Cria msg  │
└──────┬───────┘
       │
       │ POST /api/announcements
       ▼
┌──────────────┐
│   Backend    │───┐
│   Salva DB   │   │
└──────────────┘   │
                   │
       ┌───────────┘
       │
       │ Quando Receptor está no local:
       │
┌──────▼───────────┐
│   Receptor       │
│   - Envia GPS    │───┐
│   - A cada 30s   │   │
└──────────────────┘   │
                       │
         ┌─────────────┘
         │
         │ GET /api/announcements/available
         │ (Backend filtra: localização + políticas)
         │
┌────────▼─────────────┐
│   Backend            │
│   - Verifica GPS     │
│   - Verifica WiFi    │
│   - Verifica políticas│
│   - Retorna apenas   │
│     mensagens válidas│
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│   Receptor           │
│   - Recebe lista     │
│   - Mostra em        │
│     "Disponíveis"    │
│   - Notificação      │
│   - Badge com número │
└──────────────────────┘
         │
         │ POST /api/announcements/:id/receive
         ▼
┌──────────────────────┐
│   Backend            │
│   - Salva em         │
│   ReceivedAnnouncement│
│   (persistência)     │
└──────────────────────┘
```

### Cenário 2: Modo Descentralizado

```
┌──────────────────────┐
│  Publicador (A)      │
│                      │
│  1. Cria mensagem    │
│     DECENTRALIZED    │
│                      │
│  2. Backend salva    │
│     (referência)     │
│                      │
│  3. Cache local      │
│     (P2PService)     │
└──────────┬───────────┘
           │
           │ Publicador se move para local de destino
           │
           │ Loop de Publicação (a cada 10s):
           │
           │ 3.1. Verifica localização
           │      POST /api/announcements/:id/verify-location
           │      → Está no local? SIM
           │
           │ 3.2. Escaneia dispositivos
           │      WiFi Direct Discovery
           │      → Encontra: Dispositivo B, C
           │
           │ 3.3. Para cada dispositivo:
           │      - Solicita perfil (se necessário)
           │      - Verifica política
           │      - Se passar: envia via WiFi Direct
           │
           ▼
┌──────────────────────┐
│  Receptor (B)        │
│                      │
│  Listener escuta     │
│  mensagens P2P       │
│                      │
│  Recebe mensagem:    │
│  1. Verifica se já   │
│     recebeu (cache)  │
│  2. Verifica política│
│  3. Se passar:       │
│     - Adiciona cache │
│     - Mostra aba P2P │
│     - NÃO encaminha  │
└──────────────────────┘
```

---

## 🔍 Componentes da Arquitetura

### 1. Backend (Node.js + Express + Prisma)

```
┌──────────────────────────────────────────┐
│            Backend Server                │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Routes                            │ │
│  │  - /api/auth/*                     │ │
│  │  - /api/announcements/*            │ │
│  │  - /api/locations/*                │ │
│  │  - /api/profile/*                  │ │
│  │  - /api/presence/*                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Middleware                        │ │
│  │  - requireAuth (JWT)               │ │
│  │  - CORS                            │ │
│  │  - Error Handling                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Database (Prisma + PostgreSQL)    │ │
│  │  - User                            │ │
│  │  - UserProfile                     │ │
│  │  - Location                        │ │
│  │  - Announcement                    │ │
│  │  - UserLocationStatus              │ │
│  │  - ReceivedAnnouncement            │ │
│  │  - Reaction                        │ │
│  │  - Bookmark                        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Business Logic                    │ │
│  │  - checkPolicyAccess()             │ │
│  │  - isInsideGeo()                   │ │
│  │  - Filtros de localização          │ │
│  │  - Validação de políticas          │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 2. Frontend (Expo/React Native)

```
┌──────────────────────────────────────────┐
│         Frontend (Expo App)              │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Services                          │ │
│  │                                    │ │
│  │  📡 P2PService                     │ │
│  │     - Descoberta de dispositivos   │ │
│  │     - Envio/recebimento P2P        │ │
│  │     - Cache local                  │ │
│  │                                    │ │
│  │  📍 LocationService                │ │
│  │     - GPS tracking                 │ │
│  │     - WiFi ID detection            │ │
│  │     - Envio periódico (30s)        │ │
│  │                                    │ │
│  │  🔔 NotificationService            │ │
│  │     - Verificação periódica (30s)  │ │
│  │     - Notificações locais          │ │
│  │     - Badge count                  │ │
│  │                                    │ │
│  │  🌐 API Client                     │ │
│  │     - HTTP requests                │ │
│  │     - JWT authentication           │ │
│  │     - Error handling               │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Screens                           │ │
│  │  - announcements.tsx               │ │
│  │  - new-announcement.tsx            │ │
│  │  - locations.tsx                   │ │
│  │  - profile.tsx                     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Native Modules                    │ │
│  │  - expo-wifi-direct/               │ │
│  │  - expo-location                   │ │
│  │  - expo-notifications              │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 📊 Diagrama de Sequência - Modo Centralizado

```
Publicador          Backend           Database         Receptor
    │                  │                  │               │
    │ 1. POST /announcements             │               │
    │──────────────────>│                │               │
    │                  │ 2. Save         │               │
    │                  │──────────────>│                │
    │                  │<───────────────│                │
    │ 3. Response 201  │                │               │
    │<──────────────────│                │               │
    │                  │                │               │
    │                  │                │  4. Envia GPS (30s)
    │                  │                │──────────────>│
    │                  │ 5. Update location             │
    │                  │<───────────────│               │
    │                  │                │               │
    │                  │                │  6. GET /available
    │                  │                │<──────────────│
    │                  │ 7. Query DB    │               │
    │                  │──────────────>│                │
    │                  │ 8. Filter      │               │
    │                  │ (location,     │               │
    │                  │  policies)     │               │
    │                  │<───────────────│               │
    │                  │ 9. Return filtered              │
    │                  │──────────────────────────────>│
    │                  │                │  10. POST /receive
    │                  │                │──────────────>│
    │                  │ 11. Save       │               │
    │                  │──────────────>│                │
    │                  │                │               │
```

---

## 📊 Diagrama de Sequência - Modo Descentralizado

```
Publicador (A)      Backend      Receptor (B)    WiFi Direct
     │                │              │               │
     │ 1. POST /announcements                      │
     │─────────────────>│                          │
     │ 2. Save DB      │                          │
     │<─────────────────│                          │
     │ 3. Cache local  │                          │
     │                 │                          │
     │ 4. Move to location                         │
     │                 │                          │
     │ 5. Loop: Verify location                   │
     │─────────────────>│                          │
     │ 6. Is at location?                         │
     │<─────────────────│                          │
     │                 │                          │
     │ 7. Scan devices │                          │
     │─────────────────────────────────────────────>│
     │ 8. Discover: B, C                           │
     │<─────────────────────────────────────────────│
     │                 │                          │
     │ 9. For each device:                         │
     │    - Request profile                        │
     │─────────────────────────────────────────────>│
     │    - Profile response                       │
     │<─────────────────────────────────────────────│
     │    - Check policy                           │
     │    - Send message (if pass)                 │
     │─────────────────────────────────────────────>│
     │                 │                          │
     │                 │             10. Receive   │
     │                 │            message        │
     │                 │<──────────────────────────│
     │                 │             11. Check     │
     │                 │            policy         │
     │                 │             12. Add to    │
     │                 │            cache          │
     │                 │             13. Show UI   │
```

---

## 🔐 Filtros e Validações

### 1. Filtro de Localização

```
┌─────────────────────────────────────┐
│    Verificação de Localização       │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────┐      ┌─────────────────┐
│ Tipo: GEO   │      │ Tipo: WiFi/BLE  │
│             │      │                 │
│ 1. Calcula  │      │ 1. Obtém WiFi   │
│    distância│      │    IDs do usuário│
│             │      │                 │
│ 2. Fórmula  │      │ 2. Obtém IDs    │
│    Haversine│      │    do local     │
│             │      │                 │
│ 3. Se dist  │      │ 3. Se há        │
│    <= raio: │      │    interseção:  │
│    PASS     │      │    PASS         │
│    Else:    │      │    Else: FAIL   │
│    FAIL     │      │                 │
└─────────────┘      └─────────────────┘
```

### 2. Filtro de Políticas

```
┌─────────────────────────────────────┐
│    Verificação de Políticas         │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────────┐  ┌──────────────────┐
│   WHITELIST     │  │   BLACKLIST      │
│                 │  │                  │
│ 1. Obtém perfil │  │ 1. Obtém perfil  │
│    do usuário   │  │    do usuário    │
│                 │  │                  │
│ 2. Para cada    │  │ 2. Para cada     │
│    restrição:   │  │    restrição:    │
│    - Chave      │  │    - Chave       │
│      corresponde?│  │      corresponde?│
│    - Valor      │  │    - Valor       │
│      corresponde?│  │      corresponde?│
│                 │  │                  │
│ 3. Se TODAS     │  │ 3. Se NENHUMA    │
│    correspondem:│  │    corresponde:  │
│    PASS         │  │    PASS          │
│    Else: FAIL   │  │    Else: FAIL    │
└─────────────────┘  └──────────────────┘
```

### 3. Filtro de Tempo

```
┌─────────────────────────────────────┐
│    Verificação de Janela de Tempo   │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────────┐  ┌──────────────────┐
│   startsAt      │  │   endsAt         │
│                 │  │                  │
│ Se definido:    │  │ Se definido:     │
│ - Verifica se   │  │ - Verifica se    │
│   now >=        │  │   now <= endsAt  │
│   startsAt      │  │                  │
│                 │  │                  │
│ Se não passar:  │  │ Se não passar:   │
│   FAIL          │  │   FAIL           │
└─────────────────┘  └──────────────────┘
```

---

## 🎯 Pontos de Integração

### Backend ↔ Frontend

```
┌─────────────────────────────────────────┐
│           API REST Endpoints            │
│                                         │
│  POST   /api/auth/register              │
│  POST   /api/auth/login                 │
│  GET    /api/auth/me                    │
│                                         │
│  GET    /api/announcements              │
│  POST   /api/announcements              │
│  GET    /api/announcements/available    │
│  GET    /api/announcements/:id          │
│  PUT    /api/announcements/:id          │
│  DELETE /api/announcements/:id          │
│  POST   /api/announcements/:id/receive  │
│  GET    /api/announcements/decentralized│
│  POST   /api/announcements/:id/verify-location│
│                                         │
│  GET    /api/locations                  │
│  POST   /api/locations                  │
│  PUT    /api/locations/:id              │
│  DELETE /api/locations/:id              │
│                                         │
│  GET    /api/profile/attributes         │
│  POST   /api/profile/attributes         │
│  DELETE /api/profile/attributes/:key    │
│  GET    /api/profile/keys               │
│                                         │
│  POST   /api/presence/location          │
│                                         │
│  GET    /api/users                      │
└─────────────────────────────────────────┘
```

### Frontend ↔ WiFi Direct (P2P)

```
┌─────────────────────────────────────────┐
│         Native WiFi Direct API          │
│                                         │
│  ExpoWifiDirect.isSupported()          │
│  ExpoWifiDirect.discoverPeers()        │
│  ExpoWifiDirect.connect(address)       │
│  ExpoWifiDirect.sendData(address, data)│
│  ExpoWifiDirect.receiveData()          │
│  ExpoWifiDirect.getCurrentSSID()       │
└─────────────────────────────────────────┘
```

---

## 📝 Resumo da Arquitetura

### Modo Centralizado
- ✅ Mensagens armazenadas no servidor (PostgreSQL)
- ✅ Receptor consulta servidor para obter mensagens
- ✅ Filtros aplicados no servidor (localização, políticas, tempo)
- ✅ Persistência garantida (mensagens sempre disponíveis)
- ✅ Escalável (servidor centralizado)
- ⚠️ Requer conexão com internet
- ⚠️ Dependente de infraestrutura servidor

### Modo Descentralizado
- ✅ Mensagens armazenadas localmente no dispositivo publicador
- ✅ Comunicação direta dispositivo-dispositivo (WiFi Direct)
- ✅ Não requer servidor/internet
- ✅ Mais privado (sem passar por servidor)
- ✅ Funciona offline (quando no local)
- ⚠️ Requer proximidade física (WiFi Direct range)
- ⚠️ Publicador deve estar no local de destino
- ⚠️ Cache local (mensagens podem ser perdidas)

---

## 🎨 Como Desenhar a Arquitetura

### Para Apresentação/Documentação:

1. **Diagrama de Componentes** - Mostre Backend, Frontend, Database, WiFi Direct
2. **Diagrama de Sequência** - Fluxo completo de criação até recebimento
3. **Diagrama de Deployment** - Como os componentes se comunicam na rede
4. **Diagrama de Estados** - Estados da mensagem (criada → disponível → recebida)

### Ferramentas Sugeridas:

- **Draw.io** / **diagrams.net** - Gratuito, online
- **Lucidchart** - Profissional
- **Miro** - Colaborativo
- **PlantUML** - Código para diagramas
- **ASCII Art** - Para documentação texto (como acima)

---

## 🔧 Fluxo de Dados Detalhado

### Criar Anúncio (Centralizado)

```
1. Frontend (new-announcement.tsx)
   ↓
2. api.post('/announcements', {...})
   ↓
3. Backend: router.post('/', ...)
   ↓
4. Validação: createAnnouncementSchema
   ↓
5. Validação de localização (se locationId)
   ↓
6. Validação de política (WHITELIST sem restrições = erro)
   ↓
7. prisma.announcement.create()
   ↓
8. PostgreSQL: INSERT INTO Announcement
   ↓
9. Response 201 com anúncio criado
   ↓
10. Frontend: Mostra sucesso
```

### Receber Anúncio (Centralizado)

```
1. Frontend: notificationService.checkNow()
   ↓
2. api.get('/announcements/available')
   ↓
3. Backend: router.get('/available', ...)
   ↓
4. Buscar todos os anúncios
   ↓
5. Buscar localização do usuário (UserLocationStatus)
   ↓
6. Buscar perfil do usuário (UserProfile)
   ↓
7. Filtrar por:
   - Janela de tempo (startsAt, endsAt)
   - Localização (GPS raio ou WiFi IDs)
   - Políticas (Whitelist/Blacklist + perfil)
   ↓
8. Retornar lista filtrada
   ↓
9. Frontend: Mostra na aba "Disponíveis"
   ↓
10. Frontend: Envia notificação se houver novas
   ↓
11. Usuário clica "Receber"
   ↓
12. api.post('/announcements/:id/receive')
   ↓
13. Backend: prisma.receivedAnnouncement.create()
   ↓
14. PostgreSQL: INSERT INTO ReceivedAnnouncement
   ↓
15. Mensagem persiste mesmo ao sair do local
```

---

Esta documentação explica como a arquitetura funciona. Use este conteúdo para criar diagramas visuais na ferramenta de sua escolha.

