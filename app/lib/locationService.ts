import { updateUserLocation, LocationUpdate } from './api';
import { Platform } from 'react-native';

/**
 * Serviço para gerenciar a localização do utilizador e enviar periodicamente ao servidor
 */
class LocationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private currentLocation: LocationUpdate | null = null;
  private token: string | null = null;
  private updateInterval = 30000; // 30 segundos por padrão

  /**
   * Inicia o serviço de localização
   * @param token Token de autenticação
   * @param location Localização inicial (GPS ou WiFi)
   * @param interval Intervalo de atualização em ms (padrão: 30s)
   */
  start(token: string, location: LocationUpdate, interval: number = 30000) {
    if (this.isRunning) {
      this.stop();
    }

    this.token = token;
    this.currentLocation = location;
    this.updateInterval = interval;
    this.isRunning = true;

    // Enviar imediatamente
    this.sendLocation();

    // Configurar envio periódico
    this.intervalId = setInterval(() => {
      if (this.isRunning && this.currentLocation && this.token) {
        this.sendLocation();
      }
    }, this.updateInterval);

    console.log('[LocationService] Serviço iniciado');
  }

  /**
   * Atualiza a localização atual sem reiniciar o serviço
   */
  updateLocation(location: LocationUpdate) {
    this.currentLocation = location;
    if (this.isRunning && this.token) {
      this.sendLocation();
    }
  }

  /**
   * Para o serviço de localização
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[LocationService] Serviço parado');
  }

  /**
   * Envia a localização atual para o servidor
   */
  private async sendLocation() {
    if (!this.token || !this.currentLocation) {
      return;
    }

    try {
      await updateUserLocation(this.token, this.currentLocation);
      console.log('[LocationService] Localização enviada:', this.currentLocation);
      
      // Chamar callback se estiver definido
      if (this.onLocationSent) {
        this.onLocationSent(this.currentLocation);
      }
    } catch (error) {
      console.error('[LocationService] Erro ao enviar localização:', error);
    }
  }

  /**
   * Callback chamado quando a localização é enviada (para notificações)
   */
  onLocationSent: ((location: LocationUpdate) => void) | null = null;

  /**
   * Define callback para quando a localização é enviada
   */
  setOnLocationSentCallback(callback: (location: LocationUpdate) => void) {
    this.onLocationSent = callback;
  }

  /**
   * Obtém a localização atual (para uso em outros componentes)
   */
  getCurrentLocation(): LocationUpdate | null {
    return this.currentLocation;
  }
}

export const locationService = new LocationService();

/**
 * Helper para obter localização GPS (requer expo-location)
 * Se expo-location não estiver disponível, retorna null
 */
export async function getCurrentGPSLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Tentar importar expo-location dinamicamente
    // Se não estiver instalado, o import falhará e retornaremos null
    let Location: any;
    try {
      Location = require('expo-location');
    } catch {
      console.warn('[LocationService] expo-location não está instalado');
      return null;
    }

    if (!Location || !Location.getCurrentPositionAsync) {
      return null;
    }
    
    // Solicitar permissão (tentar ambas as APIs para compatibilidade)
    let permissionStatus;
    if (Location.requestForegroundPermissionsAsync) {
      const result = await Location.requestForegroundPermissionsAsync();
      permissionStatus = result.status;
    } else if (Location.requestPermissionsAsync) {
      const result = await Location.requestPermissionsAsync();
      permissionStatus = result.status;
    } else {
      console.warn('[LocationService] API de permissões não encontrada');
      return null;
    }

    if (permissionStatus !== 'granted') {
      console.warn('[LocationService] Permissão de localização negada');
      return null;
    }

    // Obter posição atual
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced || Location.Accuracy?.Balanced || 6,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    // Se expo-location não estiver instalado ou houver erro, retornar null
    console.warn('[LocationService] GPS não disponível:', error);
    return null;
  }
}

/**
 * Helper para obter WiFi IDs
 * 
 * NOTA: A leitura de WiFi SSIDs requer APIs nativas que não estão disponíveis no Expo Go.
 * Para produção, você precisará:
 * 1. Criar um módulo nativo customizado (expo-dev-client)
 * 2. Usar uma biblioteca como react-native-wifi-reborn (requer eject ou bare workflow)
 * 3. Ou permitir que o usuário insira manualmente os WiFi IDs
 * 
 * Esta implementação:
 * - Tenta detectar se há APIs nativas disponíveis
 * - Retorna array vazio se não houver suporte
 * - Pode ser estendida com módulos nativos customizados
 */
export async function getCurrentWiFiIds(): Promise<string[]> {
  if (Platform.OS === 'web') {
    // No web, não há acesso a WiFi IDs
    return [];
  }

  try {
    // Tentar usar APIs nativas se disponíveis
    // Para Expo Go, isso não funcionará, mas podemos preparar para desenvolvimento nativo
    
    // Opção 1: Tentar usar expo-network (se disponível)
    try {
      const Network = require('expo-network');
      if (Network && Network.getNetworkStateAsync) {
        const networkState = await Network.getNetworkStateAsync();
        // expo-network não fornece SSID diretamente, mas podemos verificar se está conectado
        if (networkState.type === 'WIFI' && networkState.isConnected) {
          // SSID não está disponível via expo-network
          console.log('[LocationService] Conectado via WiFi, mas SSID não disponível via Expo');
        }
      }
    } catch (e) {
      // expo-network não está instalado ou não disponível
    }

    // Opção 2: Usar módulo nativo Expo WiFi Direct
    try {
      const ExpoWifiDirect = require('../../modules/expo-wifi-direct/src').default;
      if (ExpoWifiDirect && ExpoWifiDirect.isSupported && ExpoWifiDirect.isSupported()) {
        const ssid = await ExpoWifiDirect.getCurrentSSID();
        if (ssid) {
          return [ssid];
        }
      }
    } catch (e) {
      console.warn('[LocationService] Expo WiFi Direct não disponível para SSID');
    }

    // Opção 3: react-native-wifi-reborn (alternativa)
    try {
      const WifiManager = require('react-native-wifi-reborn').default;
      if (WifiManager && WifiManager.getCurrentWifiSSID) {
        const ssid = await WifiManager.getCurrentWifiSSID();
        return ssid ? [ssid] : [];
      }
    } catch (e) {
      console.warn('[LocationService] react-native-wifi-reborn não disponível');
    }

    // Por enquanto, retornamos array vazio
    // O usuário pode inserir WiFi IDs manualmente na UI se necessário
    return [];
  } catch (error) {
    console.warn('[LocationService] Erro ao obter WiFi IDs:', error);
    return [];
  }
}

/**
 * Valida se um WiFi ID está em formato válido
 * @param wifiId WiFi ID a validar
 * @returns true se válido, false caso contrário
 */
export function isValidWiFiId(wifiId: string): boolean {
  if (!wifiId || wifiId.trim().length === 0) {
    return false;
  }
  // WiFi SSIDs geralmente têm entre 1 e 32 caracteres
  // Podem conter letras, números, espaços e alguns caracteres especiais
  return wifiId.trim().length >= 1 && wifiId.trim().length <= 32;
}

/**
 * Normaliza um WiFi ID (remove espaços extras, etc.)
 * @param wifiId WiFi ID a normalizar
 * @returns WiFi ID normalizado
 */
export function normalizeWiFiId(wifiId: string): string {
  return wifiId.trim();
}

