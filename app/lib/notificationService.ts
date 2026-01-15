import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchAvailableAnnouncements } from './api';
import { Announcement } from '../../types/api';

/**
 * Configuração de notificações locais
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Serviço para gerenciar notificações de mensagens disponíveis
 */
class NotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private token: string | null = null;
  private lastAnnouncementIds: Set<string> = new Set();
  private lastLocationKey: string | null = null; // Para detectar mudanças de localização
  private checkInterval = 30000; // Verificar a cada 30 segundos (mais frequente)
  private hasPermission = false;
  private lastCheckTime: number = 0;

  /**
   * Solicita permissão para notificações
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Anúncios Disponíveis',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#06B6D4',
          sound: 'default',
        });
      }

      return this.hasPermission;
    } catch (error) {
      console.error('[NotificationService] Erro ao solicitar permissões:', error);
      return false;
    }
  }

  /**
   * Inicia o serviço de verificação de mensagens disponíveis
   */
  async start(token: string, interval: number = 60000) {
    if (this.isRunning) {
      this.stop();
    }

    // Solicitar permissões se ainda não tiver
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.warn('[NotificationService] Permissões de notificação negadas');
        return;
      }
    }

    this.token = token;
    this.checkInterval = interval;
    this.isRunning = true;

    // Limpar histórico ao iniciar (para garantir que notifica na primeira vez)
    this.lastAnnouncementIds.clear();
    this.lastLocationKey = null;
    this.lastCheckTime = 0;

    // Verificar múltiplas vezes no início para garantir detecção:
    // 1. Primeira verificação rápida (caso já tenha localização)
    setTimeout(async () => {
      if (this.isRunning && this.token) {
        console.log('[NotificationService] 🔍 Primeira verificação (5s após inicialização)...');
        await this.checkForNewAnnouncements(true);
      }
    }, 5000); // 5 segundos

    // 2. Segunda verificação após enviar localização
    setTimeout(async () => {
      if (this.isRunning && this.token) {
        console.log('[NotificationService] 🔍 Segunda verificação (10s após inicialização - após envio de localização)...');
        await this.checkForNewAnnouncements(false);
      }
    }, 10000); // 10 segundos (após localização ser enviada)

    // Configurar verificação periódica
    this.intervalId = setInterval(async () => {
      if (this.isRunning && this.token) {
        await this.checkForNewAnnouncements(false);
      }
    }, this.checkInterval);

    console.log(`[NotificationService] Serviço iniciado (verificação a cada ${this.checkInterval / 1000}s)`);
  }

  /**
   * Para o serviço de notificações
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.lastAnnouncementIds.clear();
    console.log('[NotificationService] Serviço parado');
  }

  /**
   * Verifica se há novas mensagens disponíveis e notifica
   */
  private async checkForNewAnnouncements(isFirstCheck: boolean = false) {
    if (!this.token) {
      console.warn('[NotificationService] Token não disponível para verificação');
      return;
    }

    try {
      const response = await fetchAvailableAnnouncements(this.token);
      const announcements: Announcement[] = response.announcements || [];
      
      console.log(`[NotificationService] Verificação: ${announcements.length} mensagem(ns) disponível(eis)`);

      // Criar chave de localização baseada nos IDs dos anúncios (para detectar mudanças de local)
      const locationKey = announcements.map(a => a.id).sort().join(',');
      const locationChanged = this.lastLocationKey !== null && this.lastLocationKey !== locationKey;

      // Identificar novas mensagens (que não estavam na última verificação)
      const currentIds = new Set(announcements.map(a => a.id));
      const newAnnouncements = announcements.filter(
        a => !this.lastAnnouncementIds.has(a.id)
      );

      // Notificar se:
      // 1. Há novas mensagens (primeira vez que aparecem)
      // 2. É a primeira verificação E há mensagens disponíveis (usuário acabou de abrir o app ou entrar na tela)
      // 3. Mudou de local E há mensagens disponíveis (usuário entrou em um novo local com mensagens)
      const shouldNotify = 
        newAnnouncements.length > 0 || // Novas mensagens apareceram
        (isFirstCheck && announcements.length > 0) || // Primeira verificação com mensagens disponíveis
        (locationChanged && announcements.length > 0); // Mudou de local com mensagens disponíveis

      if (shouldNotify && announcements.length > 0) {
        // Se há novas mensagens, notificar sobre elas
        // Se não há novas mas mudou de local ou é primeira verificação, notificar sobre todas disponíveis
        const announcementsToNotify = newAnnouncements.length > 0 
          ? newAnnouncements 
          : announcements; // Se não há novas, notificar sobre todas (entrou em novo local ou primeira verificação)
        
        const reason = newAnnouncements.length > 0 
          ? 'novas mensagens'
          : isFirstCheck 
            ? 'primeira verificação (entrou na tela com mensagens disponíveis)'
            : 'mudou de local (entrou em local com mensagens)';
        
        console.log(`[NotificationService] 🔔 Notificando sobre ${announcementsToNotify.length} mensagem(ns) - Motivo: ${reason}`);
        await this.sendNotification(announcementsToNotify);
      } else {
        console.log(`[NotificationService] ℹ️ Sem notificações necessárias (${announcements.length} mensagens disponíveis, ${newAnnouncements.length} novas)`);
      }

      // Atualizar conjunto de IDs conhecidos
      this.lastAnnouncementIds = currentIds;
      this.lastLocationKey = locationKey;
      this.lastCheckTime = Date.now();

      // Atualizar badge com número de mensagens disponíveis
      await this.updateBadge(announcements.length);
    } catch (error) {
      console.error('[NotificationService] Erro ao verificar mensagens:', error);
    }
  }

  /**
   * Envia notificação sobre novas mensagens disponíveis
   */
  private async sendNotification(announcements: Announcement[]) {
    if (!this.hasPermission) {
      console.warn('[NotificationService] Sem permissão para enviar notificação. Solicitando permissões...');
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('[NotificationService] Permissões negadas. Não é possível enviar notificações.');
        return;
      }
    }

    const count = announcements.length;
    const title = count === 1 
      ? '📢 Nova mensagem disponível!' 
      : `📢 ${count} mensagens disponíveis!`;
    
    const body = count === 1
      ? announcements[0].content.substring(0, 100) + (announcements[0].content.length > 100 ? '...' : '')
      : `Você tem ${count} mensagens disponíveis no seu local atual. Abra o app para ver.`;

    try {
      // Cancelar notificações anteriores para evitar spam
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'new_announcements',
            count,
            announcementIds: announcements.map(a => a.id),
            timestamp: Date.now(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Enviar imediatamente
      });

      console.log(`[NotificationService] ✅ Notificação enviada: ${count} mensagem(ns) - "${title}"`);
    } catch (error) {
      console.error('[NotificationService] ❌ Erro ao enviar notificação:', error);
    }
  }

  /**
   * Atualiza o badge com o número de mensagens disponíveis
   */
  private async updateBadge(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.warn('[NotificationService] Erro ao atualizar badge:', error);
    }
  }

  /**
   * Limpa o badge
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      this.lastAnnouncementIds.clear();
    } catch (error) {
      console.warn('[NotificationService] Erro ao limpar badge:', error);
    }
  }

  /**
   * Verifica manualmente se há novas mensagens (útil para quando o usuário entra em um local)
   */
  async checkNow(): Promise<number> {
    if (!this.token) {
      console.warn('[NotificationService] Token não disponível para checkNow()');
      return 0;
    }

    try {
      console.log('[NotificationService] Verificação manual solicitada...');
      const response = await fetchAvailableAnnouncements(this.token);
      const announcements: Announcement[] = response.announcements || [];
      
      console.log(`[NotificationService] Verificação manual: ${announcements.length} mensagem(ns) disponível(eis)`);
      
      // Criar chave de localização
      const locationKey = announcements.map(a => a.id).sort().join(',');
      const locationChanged = this.lastLocationKey !== null && this.lastLocationKey !== locationKey;
      
      const currentIds = new Set(announcements.map(a => a.id));
      const newAnnouncements = announcements.filter(
        a => !this.lastAnnouncementIds.has(a.id)
      );

      // Notificar se há novas mensagens OU se mudou de local com mensagens disponíveis
      if (newAnnouncements.length > 0 || (locationChanged && announcements.length > 0)) {
        const toNotify = newAnnouncements.length > 0 
          ? newAnnouncements 
          : announcements;
        
        console.log(`[NotificationService] Notificando manualmente sobre ${toNotify.length} mensagem(ns)`);
        await this.sendNotification(toNotify);
      }

      this.lastAnnouncementIds = currentIds;
      this.lastLocationKey = locationKey;
      await this.updateBadge(announcements.length);

      return announcements.length;
    } catch (error) {
      console.error('[NotificationService] Erro ao verificar agora:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();

