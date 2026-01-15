# 🔔 Como Funciona o Sistema de Notificações

## Quando você recebe notificações?

Você recebe notificações nas seguintes situações:

### 1. **Primeira vez que entra na tela de Anúncios com mensagens disponíveis**
- Quando você abre a tela de Anúncios e há mensagens disponíveis no seu local atual
- A verificação acontece 8 segundos após abrir a tela (para garantir que a localização foi enviada)

### 2. **Quando você entra em um novo local com mensagens**
- Se você se move para um local diferente que tem mensagens disponíveis
- O sistema detecta automaticamente a mudança de local pela lista de IDs dos anúncios

### 3. **Quando aparecem novas mensagens no local atual**
- Se alguém publicar uma nova mensagem enquanto você está no local
- A verificação periódica detecta e notifica sobre novas mensagens

### 4. **Após o envio de localização**
- Sempre que sua localização é enviada ao servidor (a cada 30 segundos), o sistema verifica se há novas mensagens
- Aguarda 3 segundos após o envio para garantir que o backend processou

## Como funciona a verificação?

1. **Verificação periódica:** A cada 30 segundos, o sistema verifica se há mensagens disponíveis
2. **Verificação após mudança de localização:** Quando sua localização é atualizada e enviada ao servidor
3. **Verificação ao entrar na tela:** Quando você abre a tela de Anúncios

## O que aparece na notificação?

- **Título:** "📢 Nova mensagem disponível!" (1 mensagem) ou "📢 X mensagens disponíveis!" (várias)
- **Corpo:** 
  - Se 1 mensagem: Mostra os primeiros 100 caracteres do conteúdo
  - Se várias: "Você tem X mensagens disponíveis no seu local atual. Abra o app para ver."

## Como verificar se está funcionando?

### Verificar nos logs:

No terminal do Metro Bundler, você verá mensagens como:

```
[NotificationService] 🔍 Primeira verificação após inicialização...
[NotificationService] Verificação: 2 mensagem(ns) disponível(eis)
[NotificationService] 🔔 Notificando sobre 2 mensagem(ns) - Motivo: primeira verificação
[NotificationService] ✅ Notificação enviada: 2 mensagem(ns)
```

### Verificar permissões:

1. Abra o app
2. Quando aparecer o pedido de permissão para notificações, aceite
3. Se já negou anteriormente, vá em Configurações do Android > Apps > AnunciosLoc > Notificações e ative

## Troubleshooting

### Não está recebendo notificações?

1. **Verifique permissões:**
   - Abra o app e aceite permissões de notificação
   - Verifique nas configurações do Android se as notificações estão ativas

2. **Verifique localização:**
   - Certifique-se de que a localização GPS está funcionando
   - Verifique se há mensagens disponíveis no seu local atual
   - Veja a aba "Disponíveis" na tela de Anúncios

3. **Verifique logs:**
   - Olhe o terminal do Metro Bundler para ver mensagens do NotificationService
   - Procure por erros ou avisos

4. **Teste manualmente:**
   - Crie uma mensagem em um local próximo
   - Aguarde até 30 segundos para a verificação periódica
   - Ou force verificando: o sistema verifica automaticamente quando você envia localização

### Mensagens não aparecem como "novas"?

- O sistema só notifica sobre mensagens que você ainda não recebeu
- Se você já recebeu uma mensagem (clicou em "Receber"), ela não aparece como nova
- Para testar, crie uma nova mensagem em um local onde você está

## Configurações

- **Intervalo de verificação:** 30 segundos (configurável no código)
- **Delay inicial:** 8 segundos após abrir a tela (para garantir que localização foi enviada)
- **Delay após envio de localização:** 3 segundos (para garantir processamento no backend)

## Status

✅ Sistema implementado e funcionando
✅ Notificações locais configuradas
✅ Badge com contador de mensagens
✅ Detecção de mudanças de localização
✅ Verificação periódica automática

