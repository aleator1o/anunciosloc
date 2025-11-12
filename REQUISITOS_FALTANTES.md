# 📋 Lista de Requisitos Faltantes - AnunciosLoc

## ✅ Funcionalidades Implementadas

### F1. Registar Utilizador ✅
- Backend: POST /api/auth/register
- Frontend: Tela de registro funcionando

### F2. Log in/out ✅
- Backend: POST /api/auth/login, GET /api/auth/me
- Frontend: Tela de login e logout funcionando

### F3. Listar / Criar / Remover Locais ✅
- Backend: GET/POST/DELETE /api/locations
- Frontend: Telas de listagem, criação e remoção

### F4. Registar / Remover Anúncio ✅
- Backend: POST/DELETE /api/announcements
- Frontend: Criação e remoção de anúncios

### F5. Visualizar Anúncio ✅
- Backend: GET /api/announcements/:id
- Frontend: Tela de detalhes do anúncio

### Estrutura Básica ✅
- Schema do banco de dados com modelos principais
- Sistema de autenticação com JWT
- API REST funcional

---

## ❌ Funcionalidades Faltantes

### 🔴 CRÍTICO - Funcionalidades Básicas

#### F6. Editar Perfil de Utilizador com Pares Chave-Valor
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Cada utilizador tem um perfil com pares chave-valor (ex: "club=Real Madrid", "Profissao=Estudante")
- Utilizador pode adicionar/remover pares chave-valor
- Perfis são privados, mas **chaves são públicas**
- Servidor mantém lista de todas as chaves públicas
- Endpoint para listar todas as chaves disponíveis

**O que falta:**
1. **Backend:**
   - Modelo `UserProfile` no schema Prisma com campos `key` e `value`
   - Endpoint POST /api/profile/attributes (adicionar chave-valor)
   - Endpoint DELETE /api/profile/attributes/:key (remover chave-valor)
   - Endpoint GET /api/profile/attributes (listar chaves do utilizador)
   - Endpoint GET /api/profile/keys (listar TODAS as chaves públicas - sem valores)
   - Atualizar modelo User para ter relação com UserProfile

2. **Frontend:**
   - Tela de edição de perfil com gestão de chaves-valor
   - Interface para adicionar/remover pares
   - Lista de todas as chaves públicas disponíveis
   - Atualizar tela de perfil para mostrar atributos dinâmicos

---

#### Políticas de Mensagens (Whitelist/Blacklist)
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Mensagens devem ter política: **WHITELIST** ou **BLACKLIST**
- Whitelist: apenas utilizadores que correspondem à lista recebem
- Blacklist: todos recebem EXCETO os que correspondem à lista
- Lista de restrição: array de pares chave-valor do perfil (ex: `{"Profissao": "Estudante"}`)
- Política whitelist vazia = todos recebem

**O que falta:**
1. **Backend:**
   - Atualizar modelo `Announcement` no schema:
     - Campo `policyType` (WHITELIST/BLACKLIST)
     - Campo `policyRestrictions` (JSON com array de pares chave-valor)
   - Lógica de filtro de mensagens baseada em política
   - Endpoint para obter mensagens filtradas por política

2. **Frontend:**
   - Interface para selecionar política (Whitelist/Blacklist)
   - Interface para adicionar restrições (chave-valor)
   - Seleção de chaves da lista pública de chaves

**Nota:** Atualmente só existe `visibility: PUBLIC/PRIVATE`, que não atende aos requisitos.

---

#### Sistema de Recebimento de Mensagens
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Quando utilizador visita um local, deve receber notificação de mensagens disponíveis
- Utilizador pode **receber explicitamente** a mensagem
- Se receber: mensagem fica disponível mesmo após sair do local ou expirar
- Se não receber: mensagem desaparece quando sair do local ou expirar

**O que falta:**
1. **Backend:**
   - Modelo `ReceivedAnnouncement` para rastrear mensagens recebidas
   - Endpoint POST /api/announcements/:id/receive (marcar como recebida)
   - Endpoint GET /api/announcements/available (listar mensagens disponíveis no local atual)
   - Lógica para verificar se mensagem foi recebida antes de mostrar

2. **Frontend:**
   - Sistema de notificações quando há mensagens disponíveis
   - Botão "Receber" nas mensagens
   - Lista de mensagens recebidas (disponíveis sempre)
   - Lista de mensagens disponíveis (apenas no local)

---

#### Detecção de Localização (GPS/WiFi)
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Cliente deve anunciar periodicamente sua localização ao servidor
- Localização: coordenadas GPS (latitude, longitude) + IDs WiFi visíveis
- Servidor compara localização do cliente com locais cadastrados
- Servidor notifica cliente quando há mensagens disponíveis no local atual

**O que falta:**
1. **Backend:**
   - Endpoint POST /api/location/update (atualizar localização do utilizador)
   - Serviço que compara localização com locais cadastrados
   - Serviço que verifica mensagens disponíveis baseado em:
     - Localização do utilizador
     - Política da mensagem (whitelist/blacklist)
     - Perfil do utilizador
     - Janela de tempo (startsAt/endsAt)
   - Sistema de notificações push (WebSocket ou polling)

2. **Frontend:**
   - Permissões de localização GPS
   - Leitura de WiFi IDs disponíveis
   - Envio periódico de localização ao servidor
   - Sistema de notificações locais
   - Verificação automática de mensagens disponíveis

---

#### Modo de Entrega Descentralizado (WiFi Direct)
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Modo CENTRALIZED: mensagens via servidor ✅ (parcialmente)
- Modo DECENTRALIZED: mensagens via WiFi Direct ❌
- No modo descentralizado:
  - Publicador mantém mensagem no dispositivo
  - Publicador verifica se está no local de destino
  - Publicador escaneia dispositivos próximos
  - Publicador envia mensagem para dispositivos que correspondem à política
  - Dispositivos receptores apenas mostram (não encaminham)

**O que falta:**
1. **Backend:**
   - Sistema de sincronização para modo descentralizado
   - Endpoint para obter mensagens do publicador

2. **Frontend:**
   - Implementação WiFi Direct (usando Termite ou biblioteca)
   - Descoberta de dispositivos próximos
   - Envio de mensagens via WiFi Direct
   - Recebimento de mensagens via WiFi Direct
   - Verificação de política antes de receber
   - Cache local de mensagens descentralizadas

**Nota:** Requer emulador Termite ou dispositivo físico com WiFi Direct.

---

### 🟡 IMPORTANTE - Funcionalidades Avançadas

#### Roteamento de Retransmissão (Mulas)
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
- Mensagens podem ser transportadas por "mulas" (nós intermediários)
- Mula: nó que transporta mensagem de terceiros para o destino
- Mula pode ser eleita mesmo sem corresponder à política
- Mula tem espaço limitado (configurável pelo utilizador)
- Máximo de 1 salto (publicador → mula → destino)

**O que falta:**
1. **Backend:**
   - Sistema de eleição de mulas
   - Gestão de espaço de mulas
   - Roteamento de mensagens via mulas

2. **Frontend:**
   - Configuração de espaço de mula
   - Eleição de mulas
   - Transporte de mensagens via mulas
   - Algoritmo de seleção de mulas

---

#### Segurança
**Status:** ❌ NÃO IMPLEMENTADO

**Requisitos do Enunciado:**
1. Comunicação segura cliente-servidor (HTTPS/TLS)
2. Autenticação de mensagens (verificar que mensagem foi publicada por utilizador específico)
3. Integridade de mensagens (verificar que mensagem não foi adulterada)

**O que falta:**
1. **Backend:**
   - HTTPS/TLS para comunicação
   - Assinatura digital de mensagens
   - Verificação de assinaturas
   - Criptografia de mensagens

2. **Frontend:**
   - Certificados SSL
   - Verificação de assinaturas
   - Validação de integridade

---

### 🟢 MELHORIAS - Funcionalidades Parciais

#### Modo Centralizado - Melhorias
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO

**O que falta:**
- Sistema de notificações quando há mensagens disponíveis
- Polling periódico ou WebSocket para notificações
- Verificação automática de mensagens baseada em localização

#### Remoção de Locais
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO

**Requisitos do Enunciado:**
- Utilizadores podem remover locais criados por outros utilizadores

**O que falta:**
- Backend permite remoção apenas pelo owner
- Frontend não permite remover locais de outros
- Ajustar permissões no backend

---

## 📊 Resumo

### Funcionalidades Básicas: 5/6 (83%)
- ✅ F1. Registar utilizador
- ✅ F2. Log in/out
- ✅ F3. Listar / Criar / Remover locais
- ✅ F4. Registar / Remover anúncio
- ✅ F5. Visualizar anúncio
- ❌ F6. Editar perfil com chaves-valor

### Sistema de Perfis: 0/4 (0%)
- ❌ Pares chave-valor no perfil
- ❌ Adicionar/remover pares
- ❌ Listar chaves públicas
- ❌ Gestão de perfis

### Políticas de Mensagens: 0/2 (0%)
- ❌ Whitelist/Blacklist
- ❌ Restrições por perfil

### Sistema de Recebimento: 0/3 (0%)
- ❌ Receber mensagens explicitamente
- ❌ Notificações de mensagens disponíveis
- ❌ Persistência de mensagens recebidas

### Localização: 0/3 (0%)
- ❌ Detecção GPS
- ❌ Detecção WiFi IDs
- ❌ Anúncio periódico de localização

### Modo Descentralizado: 0/5 (0%)
- ❌ WiFi Direct
- ❌ Descoberta de dispositivos
- ❌ Envio via P2P
- ❌ Recebimento via P2P
- ❌ Verificação de política

### Funcionalidades Avançadas: 0/2 (0%)
- ❌ Roteamento de retransmissão (mulas)
- ❌ Segurança (HTTPS, assinaturas)

---

## 🎯 Prioridades de Implementação

### Prioridade 1 - Funcionalidades Básicas Essenciais
1. **Sistema de Perfis (F6)** - Crítico para políticas de mensagens
2. **Políticas Whitelist/Blacklist** - Requisito básico do enunciado
3. **Sistema de Recebimento** - Core da funcionalidade

### Prioridade 2 - Funcionalidades de Localização
4. **Detecção de Localização** - Necessário para notificações
5. **Anúncio Periódico de Localização** - Necessário para modo centralizado

### Prioridade 3 - Modo Descentralizado
6. **WiFi Direct** - Funcionalidade avançada básica
7. **Sistema de Entrega P2P** - Completa modo descentralizado

### Prioridade 4 - Funcionalidades Avançadas
8. **Roteamento de Retransmissão** - Funcionalidade avançada
9. **Segurança** - Funcionalidade avançada

---

## 📝 Notas Importantes

1. **Plataforma:** O projeto atual usa Expo/React Native, mas o enunciado pede Android nativo (Java). Pode ser necessário migrar ou justificar a escolha.

2. **WiFi Direct:** Requer emulador Termite ou dispositivo físico. Não funciona no Expo Go.

3. **Localização:** Requer permissões e APIs nativas do Android.

4. **Notificações:** Requer sistema de notificações push ou polling.

5. **Testes:** Projeto deve ser testado no emulador Termite conforme enunciado.

---

## 🔄 Próximos Passos

1. Implementar sistema de perfis (chaves-valor)
2. Implementar políticas whitelist/blacklist
3. Implementar sistema de recebimento de mensagens
4. Implementar detecção de localização
5. Implementar modo descentralizado (WiFi Direct)
6. Implementar funcionalidades avançadas (mulas, segurança)




Como funciona
Ao abrir a tela de anúncios:
Tenta obter GPS (se expo-location estiver instalado)
Inicia o serviço de localização (envia a cada 30s)
Carrega anúncios disponíveis no local atual
Na aba "Disponíveis":
Mostra apenas anúncios que correspondem ao local atual
Filtra por políticas (Whitelist/Blacklist) e perfil do utilizador
Botão "Receber" marca a mensagem como recebida
Após receber:
Mensagem permanece disponível mesmo ao sair do local
É removida da lista "Disponíveis" e pode aparecer em "Todos"

Como testar:
Inicie o app e vá para a tela de Anúncios
O app solicitará permissão de localização (se ainda não tiver concedido)
A localização GPS será enviada automaticamente ao servidor a cada 30 segundos
Na aba "Disponíveis", você verá os anúncios do seu local atual
Use o botão "✓ Receber" para marcar mensagens como recebidas


Como funciona agora
Uma única seção controla quem pode ver o anúncio:
Se não adicionar restrições: todos podem ver (independente de Whitelist/Blacklist)
Se adicionar restrições:
Whitelist: apenas quem tem os atributos de perfil correspondentes vê
Blacklist: todos veem, exceto quem tem os atributos correspondentes
Exemplo:
Whitelist + "Profissao=Estudante": apenas estudantes veem
Blacklist + "Profissao=Estudante": todos veem, exceto estudantes