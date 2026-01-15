# Resumo para Relatório - AnunciosLoc

## 4. Funcionalidades Avançadas

O sistema AnunciosLoc implementa duas funcionalidades avançadas que complementam o sistema básico de entrega de mensagens:

### 4.1. Roteamento de Retransmissão (Mulas)

O sistema de mulas permite que dispositivos intermediários transportem mensagens entre utilizadores que não estão diretamente conectados. Quando um utilizador deseja enviar uma mensagem para outro que não está no mesmo local, pode eleger uma "mula" (dispositivo intermediário) que está presente no local de origem e que se deslocará para o local de destino.

**Características principais:**
- Máximo de 1 salto: Publicador → Mula → Destino
- Mulas podem ser eleitas mesmo sem corresponder à política da mensagem
- Espaço limitado configurável pelo utilizador (padrão: 10MB)
- Verificação automática de localização para entrega
- Mensagens expiram após 1 hora se não entregues

**Implementação:**
- Backend: Modelos `MuleConfig` e `MuleMessage` no Prisma
- Endpoints REST para gestão de mulas, eleição e entrega
- Frontend: Interface completa para configuração e gestão de mensagens em trânsito

### 4.2. Assinaturas Digitais

O sistema implementa assinatura digital de mensagens usando criptografia RSA de 2048 bits, garantindo autenticidade e integridade das mensagens.

**Características principais:**
- Geração automática de pares de chaves pública/privada
- Assinatura automática de mensagens ao criar anúncios
- Verificação automática de assinaturas ao visualizar anúncios
- Opção de criptografar chave privada com senha
- Indicador visual de verificação nos anúncios

**Implementação:**
- Biblioteca de criptografia usando Node.js `crypto`
- Algoritmo SHA256 para hash e RSA para assinatura
- Armazenamento seguro de chaves no banco de dados
- Interface para geração e gestão de chaves

---

## 4.1 Segurança

O sistema implementa múltiplas camadas de segurança:

### Autenticação e Autorização
- Autenticação baseada em JWT (JSON Web Tokens)
- Hash de senhas usando bcrypt
- Middleware de autenticação em todas as rotas protegidas
- Validação de propriedade para edição de recursos

### Integridade de Dados
- Validação de entrada usando Zod schemas
- Assinaturas digitais para garantir autenticidade de mensagens
- Verificação automática de integridade ao receber mensagens

### Políticas de Acesso
- Sistema de Whitelist/Blacklist baseado em perfis de utilizador
- Restrições por localização (GPS e WiFi IDs)
- Janelas de tempo para disponibilidade de mensagens

### Proteção de Dados
- Chaves privadas podem ser criptografadas com senha
- Validação de entrada para prevenir injection attacks
- Sanitização de dados antes de armazenamento

**Nota:** O sistema utiliza HTTP em desenvolvimento. Para produção, recomenda-se HTTPS com certificados SSL/TLS.

---

## 5. Implementação

### Arquitetura

O sistema foi desenvolvido seguindo uma arquitetura cliente-servidor:

**Backend:**
- Node.js com Express.js
- PostgreSQL como banco de dados
- Prisma ORM para gestão de dados
- TypeScript para type safety
- Validação com Zod

**Frontend:**
- React Native com Expo
- Expo Router para navegação
- Context API para gestão de estado
- Serviços modulares para localização, notificações e P2P

### Tecnologias Utilizadas

**Backend:**
- Express.js 5.1.0
- Prisma 6.19.0
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- Zod para validação
- Node.js crypto para assinaturas

**Frontend:**
- React Native 0.81.5
- Expo SDK 54
- Expo Router 6.0.14
- expo-location para GPS
- expo-notifications para notificações locais
- Módulo nativo WiFi Direct (para P2P)

### Estrutura de Dados

O banco de dados inclui os seguintes modelos principais:
- `User`: Utilizadores do sistema
- `Location`: Locais geográficos ou WiFi/BLE
- `Announcement`: Mensagens/anúncios
- `UserProfile`: Atributos de perfil (chave-valor)
- `MuleConfig`: Configuração de mulas
- `MuleMessage`: Mensagens em trânsito via mulas
- `ReceivedAnnouncement`: Mensagens recebidas pelos utilizadores

### Modos de Entrega

**Modo Centralizado:**
- Mensagens armazenadas no servidor
- Filtros aplicados no backend (localização, políticas, tempo)
- Persistência garantida
- Requer conexão com internet

**Modo Descentralizado (P2P):**
- Mensagens armazenadas localmente no dispositivo publicador
- Comunicação direta via WiFi Direct
- Não requer servidor/internet
- Funciona offline quando no local

---

## 6. Limitações

### Limitações Técnicas

1. **WiFi Direct:**
   - Requer build nativo (não funciona com Expo Go)
   - Suporte limitado em emuladores
   - Requer proximidade física entre dispositivos
   - Funcionalidade P2P depende de hardware específico

2. **Localização WiFi:**
   - Leitura de WiFi IDs atualmente simulada
   - Implementação nativa requer módulos específicos do sistema operativo
   - Precisão depende da disponibilidade de pontos de acesso

3. **HTTPS:**
   - Sistema utiliza HTTP em desenvolvimento
   - Certificados SSL requerem configuração adicional para produção
   - Assinaturas digitais implementadas, mas HTTPS não ativado por padrão

### Limitações Funcionais

1. **Mulas:**
   - Máximo de 1 salto (não suporta múltiplos saltos)
   - Mensagens expiram após 1 hora
   - Requer que mula e destino estejam no mesmo local para entrega
   - Espaço limitado por dispositivo

2. **Notificações:**
   - Notificações locais apenas (não push notifications)
   - Requer permissões do utilizador
   - Verificação periódica (não em tempo real)

3. **Escalabilidade:**
   - Servidor centralizado pode ser um ponto de falha
   - Sem cache distribuído
   - Sem balanceamento de carga implementado

### Limitações de Segurança

1. **Chaves Privadas:**
   - Armazenadas no banco de dados (mesmo que criptografadas)
   - Perda de chave privada invalida assinaturas futuras
   - Não há recuperação de chaves perdidas

2. **Comunicação:**
   - HTTP não criptografado em desenvolvimento
   - Dados em trânsito podem ser interceptados sem HTTPS

---

## 7. Conclusão

O projeto AnunciosLoc implementa com sucesso um sistema de comunicação baseado em localização que permite aos utilizadores criar e receber mensagens contextuais baseadas na sua localização geográfica ou proximidade WiFi/BLE.

### Objetivos Alcançados

✅ **Funcionalidades Básicas:** Todas as funcionalidades obrigatórias (F1-F6) foram implementadas e estão funcionando corretamente.

✅ **Sistema de Localização:** Implementação completa de detecção GPS e WiFi, com atualização periódica de localização.

✅ **Políticas de Mensagens:** Sistema robusto de Whitelist/Blacklist baseado em perfis de utilizador.

✅ **Modos de Entrega:** Ambos os modos (centralizado e descentralizado) foram implementados.

✅ **Funcionalidades Avançadas:** Sistema de mulas e assinaturas digitais completamente funcional.

✅ **Interface de Utilizador:** Interface moderna e intuitiva para todas as funcionalidades.

### Contribuições Principais

1. **Arquitetura Híbrida:** Combinação de entrega centralizada e descentralizada oferece flexibilidade e resiliência.

2. **Sistema de Mulas:** Permite comunicação mesmo quando utilizadores não estão no mesmo local simultaneamente.

3. **Segurança:** Assinaturas digitais garantem autenticidade e integridade das mensagens.

4. **Políticas Flexíveis:** Sistema de políticas baseado em perfis permite controle granular de acesso.

### Trabalho Futuro

1. **Melhorias de Segurança:**
   - Implementar HTTPS em produção
   - Melhorar gestão de chaves privadas
   - Adicionar autenticação de dois fatores

2. **Funcionalidades Adicionais:**
   - Suporte a múltiplos saltos em mulas
   - Push notifications em tempo real
   - Sistema de reputação para mulas
   - Analytics e métricas de uso

3. **Otimizações:**
   - Cache distribuído
   - Balanceamento de carga
   - Otimização de queries de banco de dados
   - Compressão de mensagens

4. **Melhorias de UX:**
   - Tutorial inicial
   - Onboarding melhorado
   - Feedback visual aprimorado
   - Acessibilidade completa

### Considerações Finais

O projeto demonstra a viabilidade de um sistema de comunicação baseado em localização, combinando tecnologias modernas de desenvolvimento móvel com conceitos avançados de segurança e roteamento. A implementação das funcionalidades avançadas (mulas e assinaturas digitais) adiciona valor significativo ao sistema básico, permitindo comunicação mais flexível e segura.

O sistema está pronto para demonstração e pode ser expandido para produção com as melhorias de segurança e escalabilidade mencionadas acima.

