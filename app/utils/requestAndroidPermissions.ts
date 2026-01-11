import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Solicita as permissões necessárias para usar WiFi Direct no Android.
 * - Android 13+ (API 33+): `NEARBY_WIFI_DEVICES`
 * - Para descoberta/SSID em versões anteriores: `ACCESS_FINE_LOCATION`
 * Retorna true se todas as permissões necessárias foram concedidas.
 */
export default async function requestWifiDirectPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const permissionsToRequest: string[] = [];

    // Platform.Version é o nível API no React Native
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

    if (apiLevel >= 33) {
      // Android 13+ precisa de NEARBY_WIFI_DEVICES
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES as string);
    }

    // Para operações relacionadas a WiFi/SSID em Android <13, ACCESS_FINE_LOCATION é requerido
    permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION as string);

    const result = await PermissionsAndroid.requestMultiple(permissionsToRequest as any);

    for (const perm of permissionsToRequest) {
      const status = (result as any)[perm];
      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn('[requestWifiDirectPermissions] erro ao solicitar permissões', e);
    return false;
  }
}
