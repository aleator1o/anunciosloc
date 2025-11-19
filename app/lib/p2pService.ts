import { Platform } from 'react-native';
import { Announcement } from '../../types/api';
import { locationService } from './locationService';
import { fetchProfileAttributes } from './api';

/**
 * Interface para dispositivo descoberto via P2P
 */
export interface DiscoveredDevice {
  id: string; // ID único do dispositivo
  name: string; // Nome do dispositivo
  address: string; // Endereço MAC ou IP
  profileAttributes?: Array<{ key: string; value: string }>; // Atributos de perfil do dispositivo
  lastSeen: Date;
}

/**
 * Interface para mensagem P2P
 */
export interface P2PMessage {
  type: 'ANNOUNCEMENT' | 'PROFILE_REQUEST' | 'PROFILE_RESPONSE';
  announcement?: Announcement;
  profileAttributes?: Array<{ key: string; value: string }>;
  fromDeviceId: string;
  timestamp: number;
}

/**
 * Serviço para comunicação P2P via WiFi Direct
 * 
 * NOTA: WiFi Direct não está disponível no Expo Go.
 * Para produção, você precisará:
 * 1. Usar expo-dev-client para criar módulo nativo
 * 2. Ou usar biblioteca como react-native-wifi-reborn (requer bare workflow)
 * 3. Ou usar Termite emulador conforme especificação do projeto
 * 
 * Esta implementação fornece:
 * - Estrutura para integração com módulos nativos
 * - Simulação para desenvolvimento/testes
 * - Cache local de mensagens
 * - Verificação de políticas
 */
class P2PService {
  private isRunning = false;
  private isPublishing = false;
  private isListening = false;
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map();
  private localAnnouncements: Map<string, Announcement> = new Map(); // Cache local de anúncios descentralizados (para publicar)
  private receivedAnnouncements: Map<string, Announcement> = new Map(); // Anúncios recebidos via P2P
  private receivedMessages: Set<string> = new Set(); // IDs de mensagens já recebidas
  private token: string | null = null;
  private userId: string | null = null;
  private profileAttributes: Array<{ key: string; value: string }> = [];
  private deviceId: string;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private publishInterval: NodeJS.Timeout | null = null;
  private listenInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Gerar ID único do dispositivo (em produção, usar MAC address ou UUID persistente)
    this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicia o serviço P2P
   */
  async start(token: string, userId: string) {
    if (this.isRunning) {
      this.stop();
    }

    this.token = token;
    this.userId = userId;
    this.isRunning = true;

    // Carregar atributos de perfil do usuário
    try {
      const profile = await fetchProfileAttributes(token);
      this.profileAttributes = profile.attributes.map(attr => ({
        key: attr.key,
        value: attr.value,
      }));
    } catch (error) {
      console.warn('[P2PService] Erro ao carregar perfil:', error);
    }

    // Iniciar descoberta de dispositivos
    await this.startDiscovery();

    // Iniciar escuta de mensagens
    await this.startListening();

    console.log('[P2PService] Serviço iniciado');
  }

  /**
   * Para o serviço P2P
   */
  stop() {
    this.isRunning = false;
    this.isPublishing = false;
    this.isListening = false;

    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }

    if (this.listenInterval) {
      clearInterval(this.listenInterval);
      this.listenInterval = null;
    }

    this.discoveredDevices.clear();
    console.log('[P2PService] Serviço parado');
  }

  /**
   * Inicia descoberta de dispositivos próximos
   */
  private async startDiscovery() {
    if (!this.isRunning) return;

    // Verificar se WiFi Direct está disponível
    const wifiDirectAvailable = await this.checkWiFiDirectAvailability();

    if (!wifiDirectAvailable) {
      console.warn('[P2PService] WiFi Direct não disponível. Usando modo simulado.');
      // Em modo simulado, criar dispositivos fictícios para testes
      this.simulateDeviceDiscovery();
      return;
    }

    // Em produção, usar API nativa para descobrir dispositivos
    // Exemplo com react-native-wifi-reborn:
    // try {
    //   const WifiManager = require('react-native-wifi-reborn').default;
    //   const peers = await WifiManager.getPeers();
    //   peers.forEach(peer => {
    //     this.discoveredDevices.set(peer.address, {
    //       id: peer.address,
    //       name: peer.deviceName || 'Unknown',
    //       address: peer.address,
    //       lastSeen: new Date(),
    //     });
    //   });
    // } catch (error) {
    //   console.error('[P2PService] Erro ao descobrir dispositivos:', error);
    // }

    // Descobrir dispositivos periodicamente (a cada 10 segundos)
    this.discoveryInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.discoverDevices();
      }
    }, 10000);
  }

  /**
   * Verifica se WiFi Direct está disponível
   */
  private async checkWiFiDirectAvailability(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      // Tentar usar módulo nativo Expo WiFi Direct
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported) {
        return ExpoWifiDirect.isSupported();
      }
    } catch (e) {
      console.warn('[P2PService] Módulo Expo WiFi Direct não disponível:', e);
    }

    // Fallback: tentar react-native-wifi-reborn se disponível
    try {
      const WifiManager = require('react-native-wifi-reborn').default;
      if (WifiManager && WifiManager.isWifiDirectSupported) {
        return await WifiManager.isWifiDirectSupported();
      }
    } catch (e) {
      console.warn('[P2PService] react-native-wifi-reborn não disponível');
    }

    return false;
  }

  /**
   * Descobre dispositivos próximos
   */
  private async discoverDevices() {
    try {
      // Tentar usar módulo nativo Expo WiFi Direct
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported && ExpoWifiDirect.isSupported()) {
        const isEnabled = await ExpoWifiDirect.isEnabled();
        if (!isEnabled) {
          await ExpoWifiDirect.enable();
        }

        await ExpoWifiDirect.discoverPeers();
        const peers = await ExpoWifiDirect.getPeers();

        // Atualizar lista de dispositivos descobertos
        peers.forEach((peer: any) => {
          this.discoveredDevices.set(peer.deviceAddress, {
            id: peer.deviceAddress,
            name: peer.deviceName || 'Unknown Device',
            address: peer.deviceAddress,
            lastSeen: new Date(),
          });
        });

        return;
      }
    } catch (e) {
      console.warn('[P2PService] Erro ao usar Expo WiFi Direct:', e);
    }

    // Fallback: tentar react-native-wifi-reborn
    try {
      const WifiManager = require('react-native-wifi-reborn').default;
      if (WifiManager && WifiManager.getPeers) {
        const peers = await WifiManager.getPeers();
        peers.forEach((peer: any) => {
          this.discoveredDevices.set(peer.address, {
            id: peer.address,
            name: peer.deviceName || 'Unknown Device',
            address: peer.address,
            lastSeen: new Date(),
          });
        });
        return;
      }
    } catch (e) {
      console.warn('[P2PService] react-native-wifi-reborn não disponível');
    }

    // Se nenhum módulo nativo disponível, usar simulação
    this.simulateDeviceDiscovery();
  }

  /**
   * Simula descoberta de dispositivos (para desenvolvimento)
   */
  private simulateDeviceDiscovery() {
    // Criar alguns dispositivos fictícios para testes
    const simulatedDevices = [
      { id: 'device_1', name: 'Dispositivo Teste 1', address: '00:11:22:33:44:55' },
      { id: 'device_2', name: 'Dispositivo Teste 2', address: '00:11:22:33:44:56' },
    ];

    simulatedDevices.forEach(device => {
      if (!this.discoveredDevices.has(device.id)) {
        this.discoveredDevices.set(device.id, {
          ...device,
          lastSeen: new Date(),
        });
      } else {
        // Atualizar lastSeen
        const existing = this.discoveredDevices.get(device.id)!;
        existing.lastSeen = new Date();
      }
    });

    // Remover dispositivos que não foram vistos há mais de 30 segundos
    const now = new Date();
    for (const [id, device] of this.discoveredDevices.entries()) {
      if (now.getTime() - device.lastSeen.getTime() > 30000) {
        this.discoveredDevices.delete(id);
      }
    }
  }

  /**
   * Inicia escuta de mensagens P2P
   */
  private async startListening() {
    if (!this.isRunning || this.isListening) return;

    this.isListening = true;

    try {
      // Tentar usar módulo nativo Expo WiFi Direct
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported && ExpoWifiDirect.isSupported()) {
        // Configurar listeners para eventos
        ExpoWifiDirect.addDataReceivedListener((data: { deviceAddress: string; data: string }) => {
          try {
            const message: P2PMessage = JSON.parse(data.data);
            this.handleReceivedMessage(message);
          } catch (e) {
            console.error('[P2PService] Erro ao processar mensagem recebida:', e);
          }
        });

        ExpoWifiDirect.addPeerDiscoveredListener((peer: any) => {
          this.discoveredDevices.set(peer.deviceAddress, {
            id: peer.deviceAddress,
            name: peer.deviceName || 'Unknown Device',
            address: peer.deviceAddress,
            lastSeen: new Date(),
          });
        });

        console.log('[P2PService] Listeners WiFi Direct configurados');
        return;
      }
    } catch (e) {
      console.warn('[P2PService] Erro ao configurar listeners WiFi Direct:', e);
    }

    // Fallback: polling periódico
    this.listenInterval = setInterval(async () => {
      if (this.isListening) {
        await this.checkForIncomingMessages();
      }
    }, 5000); // Verificar a cada 5 segundos
  }

  /**
   * Verifica se há mensagens recebidas
   */
  private async checkForIncomingMessages() {
    try {
      // Tentar usar módulo nativo Expo WiFi Direct
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported && ExpoWifiDirect.isSupported()) {
        // Listener já está configurado no startListening
        // Esta função pode ser usada para polling se necessário
        return;
      }
    } catch (e) {
      console.warn('[P2PService] Erro ao verificar mensagens via Expo WiFi Direct:', e);
    }

    // Em produção, isso seria uma callback de API nativa
    // Por enquanto, simulado
  }

  /**
   * Adiciona anúncio ao cache local (para publicar)
   */
  addLocalAnnouncement(announcement: Announcement) {
    if (announcement.deliveryMode === 'DECENTRALIZED') {
      this.localAnnouncements.set(announcement.id, announcement);
      console.log(`[P2PService] Anúncio adicionado ao cache local: ${announcement.id}`);
    }
  }

  /**
   * Remove anúncio do cache local
   */
  removeLocalAnnouncement(announcementId: string) {
    this.localAnnouncements.delete(announcementId);
  }

  /**
   * Inicia publicação de anúncios descentralizados
   */
  async startPublishing() {
    if (!this.isRunning || this.isPublishing) return;

    this.isPublishing = true;

    // Verificar se está no local de destino e publicar periodicamente
    this.publishInterval = setInterval(async () => {
      if (this.isPublishing) {
        await this.publishAnnouncements();
      }
    }, 15000); // Publicar a cada 15 segundos
  }

  /**
   * Para publicação de anúncios
   */
  stopPublishing() {
    this.isPublishing = false;
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }
  }

  /**
   * Publica anúncios para dispositivos próximos
   */
  private async publishAnnouncements() {
    if (this.localAnnouncements.size === 0) {
      return;
    }

    // Verificar se está no local de destino de cada anúncio
    const currentLocation = locationService.getCurrentLocation();
    if (!currentLocation) {
      return; // Sem localização, não publicar
    }

    // Para cada anúncio descentralizado
    for (const [announcementId, announcement] of this.localAnnouncements.entries()) {
      // Verificar se está no local de destino (isso seria verificado no backend)
      // Por enquanto, assumir que está no local se tiver localização

      // Para cada dispositivo descoberto
      for (const [deviceId, device] of this.discoveredDevices.entries()) {
        // Verificar política antes de enviar
        const shouldSend = await this.checkPolicy(announcement, device);
        
        if (shouldSend) {
          await this.sendMessage(device, {
            type: 'ANNOUNCEMENT',
            announcement,
            fromDeviceId: this.deviceId,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Verifica se deve enviar mensagem baseado na política
   */
  private async checkPolicy(
    announcement: Announcement,
    device: DiscoveredDevice
  ): Promise<boolean> {
    // Se não houver restrições, enviar para todos
    const restrictions = announcement.policyRestrictions as Array<{ key: string; value: string }> | null | undefined;
    if (!restrictions || restrictions.length === 0) {
      return true;
    }

    // Se o dispositivo não tiver perfil carregado, solicitar
    if (!device.profileAttributes || device.profileAttributes.length === 0) {
      // Solicitar perfil do dispositivo
      await this.requestDeviceProfile(device);
      return false; // Aguardar resposta do perfil
    }

    // Verificar se o perfil do dispositivo corresponde à política
    const deviceProfileMap = new Map(
      device.profileAttributes.map(attr => [attr.key.toLowerCase(), attr.value.toLowerCase()])
    );

    const matches = restrictions.every(r => 
      deviceProfileMap.get(r.key.toLowerCase()) === r.value.toLowerCase()
    );

    const policyType = announcement.policyType || 'WHITELIST';
    return policyType === 'WHITELIST' ? matches : !matches;
  }

  /**
   * Solicita perfil de um dispositivo
   */
  private async requestDeviceProfile(device: DiscoveredDevice) {
    await this.sendMessage(device, {
      type: 'PROFILE_REQUEST',
      fromDeviceId: this.deviceId,
      timestamp: Date.now(),
    });
  }

  /**
   * Envia mensagem para um dispositivo
   */
  private async sendMessage(device: DiscoveredDevice, message: P2PMessage) {
    try {
      // Tentar usar módulo nativo Expo WiFi Direct
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported && ExpoWifiDirect.isSupported()) {
        // Conectar se não estiver conectado
        const connected = await ExpoWifiDirect.connect(device.address);
        if (connected) {
          const sent = await ExpoWifiDirect.sendData(device.address, JSON.stringify(message));
          if (sent) {
            console.log(`[P2PService] Mensagem enviada via WiFi Direct para ${device.name}`);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[P2PService] Erro ao usar Expo WiFi Direct para enviar:', e);
    }

    // Fallback: tentar react-native-wifi-reborn
    try {
      const WifiManager = require('react-native-wifi-reborn').default;
      if (WifiManager && WifiManager.sendData) {
        await WifiManager.sendData(device.address, JSON.stringify(message));
        console.log(`[P2PService] Mensagem enviada via WiFi Direct para ${device.name}`);
        return;
      }
    } catch (e) {
      console.warn('[P2PService] react-native-wifi-reborn não disponível para envio');
    }

    // Se nenhum módulo disponível, apenas log
    console.log(`[P2PService] Mensagem simulada para ${device.name}:`, message.type);
  }

  /**
   * Processa mensagem recebida
   */
  async handleReceivedMessage(message: P2PMessage): Promise<Announcement | null> {
    // Verificar se já recebeu esta mensagem
    const messageId = `${message.fromDeviceId}_${message.timestamp}`;
    if (this.receivedMessages.has(messageId)) {
      return null; // Já recebida
    }

    this.receivedMessages.add(messageId);

    switch (message.type) {
      case 'ANNOUNCEMENT':
        if (message.announcement) {
          // Verificar política antes de aceitar
          const device: DiscoveredDevice = {
            id: message.fromDeviceId,
            name: 'Unknown',
            address: '',
            profileAttributes: this.profileAttributes,
            lastSeen: new Date(),
          };

          const shouldAccept = await this.checkPolicy(message.announcement, device);
          if (shouldAccept) {
            // Adicionar à lista de anúncios recebidos
            this.receivedAnnouncements.set(message.announcement.id, message.announcement);
            return message.announcement;
          }
        }
        break;

      case 'PROFILE_REQUEST':
        // Responder com perfil local
        await this.sendMessage(
          { id: message.fromDeviceId, name: '', address: '', lastSeen: new Date() },
          {
            type: 'PROFILE_RESPONSE',
            profileAttributes: this.profileAttributes,
            fromDeviceId: this.deviceId,
            timestamp: Date.now(),
          }
        );
        break;

      case 'PROFILE_RESPONSE':
        // Atualizar perfil do dispositivo
        if (message.profileAttributes) {
          const device = this.discoveredDevices.get(message.fromDeviceId);
          if (device) {
            device.profileAttributes = message.profileAttributes;
          }
        }
        break;
    }

    return null;
  }

  /**
   * Obtém lista de dispositivos descobertos
   */
  getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Obtém anúncios locais (cache para publicar)
   */
  getLocalAnnouncements(): Announcement[] {
    return Array.from(this.localAnnouncements.values());
  }

  /**
   * Obtém anúncios recebidos via P2P
   */
  getReceivedAnnouncements(): Announcement[] {
    return Array.from(this.receivedAnnouncements.values());
  }

  /**
   * Limpa mensagens recebidas antigas (mais de 1 hora)
   */
  cleanupOldMessages() {
    const oneHourAgo = Date.now() - 3600000;
    // Limpar IDs de mensagens antigas (implementação simplificada)
    // Em produção, manter timestamp de cada mensagem
  }
}

export const p2pService = new P2PService();

