import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const locations = [
    {
      id: 1,
      name: 'Largo da Independência',
      category: 'Centro Histórico',
      distance: '0.8 km',
      announcements: 3,
      users: 12,
      status: 'Ativo',
      connection: 'GPS',
      icon: '📍',
      color: '#06B6D4',
    },
    {
      id: 2,
      name: 'Belas Shopping',
      category: 'Centro Comercial',
      distance: '1.2 km',
      announcements: 8,
      users: 24,
      status: 'Ativo',
      connection: 'WiFi',
      icon: '🛒',
      color: '#F97316',
    },
    {
      id: 3,
      name: 'Ginásio do Camama I',
      category: 'Desporto',
      distance: '2.1 km',
      announcements: 5,
      users: 8,
      status: 'Ativo',
      connection: 'BLE',
      icon: '🏋️',
      color: '#10B981',
    },
  ];

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'announcements') {
      router.push('/announcements');
    } else if (tab === 'locations') {
      //router.push('/locations');
    } else if (tab === 'profile') {
      router.push('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
          <Text style={styles.headerTitle}>AnunciosLoc</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Bem-vindo ao{'\n'}AnunciosLoc</Text>
            <Text style={styles.welcomeText}>
              Descubra anúncios baseados na sua localização. Conecte-se com a sua comunidade local.
            </Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>📍 Luanda, Angola</Text>
              <Text style={styles.wifiText}>📶 WiFi Direct Ativo</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.megaphoneButton}>
            <Text style={styles.megaphoneIcon}>📢</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar locais próximos..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
        >
          <TouchableOpacity style={[styles.categoryTab, styles.categoryTabActive]}>
            <Text style={styles.categoryIcon}>☰</Text>
            <Text style={styles.categoryTextActive}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryTab}>
            <Text style={styles.categoryIcon}>🛒</Text>
            <Text style={styles.categoryText}>Comércio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryTab}>
            <Text style={styles.categoryIcon}>🎓</Text>
            <Text style={styles.categoryText}>Educação</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Locais</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F97316' }]}>47</Text>
            <Text style={styles.statLabel}>Anúncios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>156</Text>
            <Text style={styles.statLabel}>Utilizadores</Text>
          </View>
        </View>

        {/* Locations List */}
        <Text style={styles.sectionTitle}>Locais Próximos</Text>
        
        {locations.map((location) => (
          <TouchableOpacity key={location.id} style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: location.color }]}>
              <Text style={styles.locationIconText}>{location.icon}</Text>
            </View>
            
            <View style={styles.locationDetails}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>{location.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{location.status}</Text>
                </View>
              </View>
              
              <Text style={styles.locationCategory}>
                {location.category} • {location.distance}
              </Text>
              
              <View style={styles.locationFooter}>
                <Text style={styles.locationStats}>
                  {location.announcements} anúncios ativos • {location.users} utilizadores próximos
                </Text>
                <View style={styles.connectionBadge}>
                  <Text style={styles.connectionText}>📶 {location.connection}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => handleNavigation('home')}
        >
          <View style={activeTab === 'home' ? styles.navIconActive : styles.navIcon}>
            <Text style={styles.navIconText}>🏠</Text>
          </View>
          <Text style={activeTab === 'home' ? styles.navTextActive : styles.navText}>Início</Text>
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
          style={styles.navItem}
          onPress={() => handleNavigation('locations')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📍</Text>
          </View>
          <Text style={styles.navText}>Locais</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeCard: {
    backgroundColor: '#06B6D4',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#E0F2FE',
    marginBottom: 16,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  wifiText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  megaphoneButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  megaphoneIcon: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  categoryTabs: {
    marginBottom: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#06B6D4',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#06B6D4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  locationCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationStats: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  connectionBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectionText: {
    fontSize: 11,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 8,
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

export default HomeScreen;