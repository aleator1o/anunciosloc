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
  private checkInterval = 60000; // Verificar a cada 60 segundos
  private hasPermission = false;

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

    // Verificar imediatamente
    await this.checkForNewAnnouncements();

    // Configurar verificação periódica
    this.intervalId = setInterval(() => {
      if (this.isRunning && this.token) {
        this.checkForNewAnnouncements();
      }
    }, this.checkInterval);

    console.log('[NotificationService] Serviço iniciado');
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
  private async checkForNewAnnouncements() {
    if (!this.token) {
      return;
    }

    try {
      const response = await fetchAvailableAnnouncements(this.token);
      const announcements: Announcement[] = response.announcements || [];

      // Identificar novas mensagens (que não estavam na última verificação)
      const currentIds = new Set(announcements.map(a => a.id));
      const newAnnouncements = announcements.filter(
        a => !this.lastAnnouncementIds.has(a.id)
      );

      // Se houver novas mensagens, notificar
      if (newAnnouncements.length > 0) {
        await this.sendNotification(newAnnouncements);
      }

      // Atualizar conjunto de IDs conhecidos
      this.lastAnnouncementIds = currentIds;

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
      return;
    }

    const count = announcements.length;
    const title = count === 1 
      ? 'Nova mensagem disponível!' 
      : `${count} novas mensagens disponíveis!`;
    
    const body = count === 1
      ? announcements[0].content.substring(0, 100) + (announcements[0].content.length > 100 ? '...' : '')
      : `Você tem ${count} mensagens disponíveis no seu local atual.`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'new_announcements',
            count,
            announcementIds: announcements.map(a => a.id),
          },
          sound: true,
        },
        trigger: null, // Enviar imediatamente
      });

      console.log(`[NotificationService] Notificação enviada: ${count} nova(s) mensagem(ns)`);
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação:', error);
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
      return 0;
    }

    try {
      const response = await fetchAvailableAnnouncements(this.token);
      const announcements: Announcement[] = response.announcements || [];
      
      const currentIds = new Set(announcements.map(a => a.id));
      const newCount = announcements.filter(
        a => !this.lastAnnouncementIds.has(a.id)
      ).length;

      if (newCount > 0) {
        const newAnnouncements = announcements.filter(
          a => !this.lastAnnouncementIds.has(a.id)
        );
        await this.sendNotification(newAnnouncements);
      }

      this.lastAnnouncementIds = currentIds;
      await this.updateBadge(announcements.length);

      return announcements.length;
    } catch (error) {
      console.error('[NotificationService] Erro ao verificar agora:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();

