import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
import { Location } from '../types/api';

const LocationsScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      router.push('/home');
    } else if (tab === 'announcements') {
      router.push('/announcements');
    } else if (tab === 'profile') {
      router.push('/profile');
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ locations: Location[] }>('/locations', token);
        setLocations(response.locations);
      } catch (err) {
        setError((err as Error).message ?? 'Não foi possível carregar os locais');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [token, router]);

  const deleteLocation = async (locationId: string) => {
    if (!token) return;

    const location = locations.find(l => l.id === locationId);
    const locationName = location?.name || 'este local';

    Alert.alert(
      'Confirmar Remoção',
      `Tem certeza que deseja remover "${locationName}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/locations/${locationId}`, token);
              setLocations((prev) => prev.filter((location) => location.id !== locationId));
              Alert.alert('Sucesso', 'Local removido com sucesso!');
            } catch (err) {
              const errorMessage = (err as Error).message ?? 'Não foi possível remover o local';
              console.error('[Locations] Erro ao remover local:', err);
              Alert.alert('Erro', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
         
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Locais</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Title */}
        <Text style={styles.sectionTitle}>Meus Locais</Text>

        {loading && <ActivityIndicator color="#06B6D4" style={{ marginVertical: 24 }} />}

        {error && !loading && (
          <Text style={{ color: '#EF4444', marginBottom: 12 }}>{error}</Text>
        )}

        {!loading && !error && locations.length === 0 && (
          <Text style={{ color: '#6B7280' }}>Ainda não há locais registados.</Text>
        )}

        {!loading &&
          !error &&
          locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={[styles.locationIcon, { backgroundColor: '#06B6D4' }]}>
                <Text style={styles.locationIconText}>{location.type === 'GEO' ? '📍' : '📶'}</Text>
              </View>

              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{location.name}</Text>

                {location.latitude !== undefined && location.latitude !== null && location.longitude !== undefined && location.longitude !== null ? (
                  <Text style={styles.locationInfo}>
                    Lat: {location.latitude?.toFixed(4)} • Lon: {location.longitude?.toFixed(4)}
                  </Text>
                ) : (
                  <Text style={styles.locationInfo}>
                    IDs WiFi/BLE: {location.identifiers.join(', ') || 'n/d'}
                  </Text>
                )}
                {location.radiusMeters && (
                  <Text style={styles.locationInfo}>Raio: {location.radiusMeters} m</Text>
                )}
              </View>

              <TouchableOpacity style={styles.menuButton} onPress={() => deleteLocation(location.id)}>
                <Text style={styles.menuIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/create-location')}
      >
        <Text style={styles.fabIcon}>🛡️</Text>
        <Text style={styles.fabText}>Criar Novo Local</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('home')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🏠</Text>
          </View>
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('announcements')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📢</Text>
          </View>
          <Text style={styles.navText}>Anúncios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleNavigation('locations')}
        >
          <View style={styles.navIconActive}>
            <Text style={styles.navIconText}>📍</Text>
          </View>
          <Text style={styles.navTextActive}>Locais</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('profile')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>👤</Text>
          </View>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 28,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  locationInfo: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: '#06B6D4',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state
  },
  navIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconActive: {
    width: 48,
    height: 48,
    backgroundColor: '#06B6D4',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconText: {
    fontSize: 20,
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
  },
  navTextActive: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '600',
  },
});

export default LocationsScreen;