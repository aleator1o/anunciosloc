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
    } catch (error) {
      console.error('[LocationService] Erro ao enviar localização:', error);
    }
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
 * Helper para obter WiFi IDs (simulado - em produção seria necessário usar APIs nativas)
 * Por enquanto, retorna array vazio ou valores de teste
 */
export async function getCurrentWiFiIds(): Promise<string[]> {
  // Em produção, isso requereria APIs nativas do Android/iOS
  // Por enquanto, retornamos array vazio ou valores de teste
  // O utilizador pode inserir manualmente na UI
  return [];
}

