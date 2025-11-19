const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withExpoWifiDirect(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Adicionar permissões se não existirem
    const permissions = [
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.CHANGE_WIFI_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CHANGE_NETWORK_STATE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ];

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    permissions.forEach((permission) => {
      if (!androidManifest['uses-permission'].some(p => p.$['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Android 13+ requer permissão adicional
    if (androidManifest.$['android:targetSdkVersion'] >= 33) {
      const nearbyPermission = 'android.permission.NEARBY_WIFI_DEVICES';
      if (!androidManifest['uses-permission'].some(p => p.$['android:name'] === nearbyPermission)) {
        androidManifest['uses-permission'].push({
          $: { 
            'android:name': nearbyPermission,
            'android:usesPermissionFlags': 'neverForLocation'
          },
        });
      }
    }

    return config;
  });
};

