import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';
import { Platform } from 'react-native';

// Import the native module. On web, it will be resolved to ExpoWifiDirect.web.ts
// and on native platforms to the native module registered in the native code.
const ExpoWifiDirectModule = Platform.OS !== 'web' 
  ? (NativeModulesProxy.ExpoWifiDirect || null)
  : null;

const fallbackModule = {
  // Fallback implementation for web/unsupported platforms
  isSupported: () => false,
  isEnabled: () => Promise.resolve(false),
  enable: () => Promise.resolve(false),
  discoverPeers: () => Promise.resolve([]),
  getPeers: () => Promise.resolve([]),
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(false),
  sendData: () => Promise.resolve(false),
  getCurrentSSID: () => Promise.resolve(null),
};

const emitter = ExpoWifiDirectModule 
  ? new EventEmitter(ExpoWifiDirectModule)
  : new EventEmitter();

export interface WifiDirectPeer {
  deviceName: string;
  deviceAddress: string;
  isGroupOwner: boolean;
  primaryDeviceType?: string;
  secondaryDeviceType?: string;
}

export interface WifiDirectConfig {
  deviceName?: string;
  groupOwnerIntent?: number; // 0-15, higher = more likely to be group owner
}

export default {
  /**
   * Verifica se WiFi Direct é suportado no dispositivo
   */
  isSupported(): boolean {
    if (Platform.OS === 'web') return false;
    if (!ExpoWifiDirectModule) return false;
    return ExpoWifiDirectModule.isSupported ? ExpoWifiDirectModule.isSupported() : false;
  },

  /**
   * Verifica se WiFi Direct está habilitado
   */
  async isEnabled(): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.isEnabled) return false;
    return await ExpoWifiDirectModule.isEnabled();
  },

  /**
   * Habilita WiFi Direct
   */
  async enable(): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.enable) return false;
    return await ExpoWifiDirectModule.enable();
  },

  /**
   * Desabilita WiFi Direct
   */
  async disable(): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.disable) return false;
    return await ExpoWifiDirectModule.disable();
  },

  /**
   * Inicia descoberta de peers (dispositivos próximos)
   */
  async discoverPeers(): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.discoverPeers) return false;
    return await ExpoWifiDirectModule.discoverPeers();
  },

  /**
   * Para descoberta de peers
   */
  async stopPeerDiscovery(): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.stopPeerDiscovery) return false;
    return await ExpoWifiDirectModule.stopPeerDiscovery();
  },

  /**
   * Obtém lista de peers descobertos
   */
  async getPeers(): Promise<WifiDirectPeer[]> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.getPeers) return [];
    try {
      const peersJson = await ExpoWifiDirectModule.getPeers();
      if (typeof peersJson === 'string') {
        return JSON.parse(peersJson);
      }
      return peersJson || [];
    } catch (e) {
      console.error('[ExpoWifiDirect] Erro ao obter peers:', e);
      return [];
    }
  },

  /**
   * Conecta a um peer
   */
  async connect(deviceAddress: string, config?: WifiDirectConfig): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.connect) return false;
    const configMap = config ? {
      groupOwnerIntent: config.groupOwnerIntent,
    } : undefined;
    return await ExpoWifiDirectModule.connect(deviceAddress, configMap);
  },

  /**
   * Desconecta de um peer
   */
  async disconnect(deviceAddress: string): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.disconnect) return false;
    return await ExpoWifiDirectModule.disconnect(deviceAddress);
  },

  /**
   * Envia dados para um peer conectado
   */
  async sendData(deviceAddress: string, data: string): Promise<boolean> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.sendData) return false;
    return await ExpoWifiDirectModule.sendData(deviceAddress, data);
  },

  /**
   * Obtém SSID da rede WiFi atual
   */
  async getCurrentSSID(): Promise<string | null> {
    if (!ExpoWifiDirectModule || !ExpoWifiDirectModule.getCurrentSSID) return null;
    return await ExpoWifiDirectModule.getCurrentSSID();
  },

  /**
   * Adiciona listener para eventos de peers descobertos
   */
  addPeerDiscoveredListener(listener: (peer: WifiDirectPeer) => void): Subscription {
    return emitter.addListener('onPeerDiscovered', listener);
  },

  /**
   * Adiciona listener para eventos de conexão
   */
  addConnectionListener(listener: (data: { deviceAddress: string; connected: boolean }) => void): Subscription {
    return emitter.addListener('onConnectionChanged', listener);
  },

  /**
   * Adiciona listener para dados recebidos
   */
  addDataReceivedListener(listener: (data: { deviceAddress: string; data: string }) => void): Subscription {
    return emitter.addListener('onDataReceived', listener);
  },
};

