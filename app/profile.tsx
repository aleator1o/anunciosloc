import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from './context/AuthContext';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      router.push('/home');
    } else if (tab === 'announcements') {
      router.push('/announcements');
    } else if (tab === 'locations') {
      router.push('/locations');
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleLogout = () => {
    Alert.alert('Terminar Sessão', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          console.log('[Profile] Iniciando logout...');
          logout();
          console.log('[Profile] Logout executado, navegando para login...');
          // Usar router.push primeiro e depois replace para garantir que funcione
          router.push('/login');
          // Forçar navegação após um pequeno delay
          setTimeout(() => {
            router.replace('/login');
          }, 200);
        },
      },
    ]);
  };

  const profileData = {
    username: user?.username ?? 'Utilizador',
    email: user?.email ?? 'sem-email',
    occupation: 'Estudante',
    club: 'Real Madrid',
    age: '25',
    city: 'Luanda',
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
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nome de Utilizador</Text>
              <Text style={styles.infoValue}>{profileData.username}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>✉️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData.email}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Attributes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atributos do Perfil</Text>
          
          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💼</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Profissão</Text>
              <Text style={styles.infoValue}>{profileData.occupation}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>⚽</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Clube</Text>
              <Text style={styles.infoValue}>{profileData.club}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎂</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Idade</Text>
              <Text style={styles.infoValue}>{profileData.age}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🏙️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cidade</Text>
              <Text style={styles.infoValue}>{profileData.city}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acções</Text>
          
          <TouchableOpacity style={styles.infoCard} onPress={handleEditProfile}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>✏️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Editar Perfil</Text>
              <Text style={styles.infoDescription}>
                Modificar informações pessoais e atributos.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={handleSettings}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Configurações</Text>
              <Text style={styles.infoDescription}>
                Ajustar configurações da aplicação.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.infoCard, styles.logoutCard]} 
            onPress={handleLogout}
          >
            <View style={[styles.iconContainer, styles.logoutIconContainer]}>
              <Text style={styles.iconText}>🚪</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, styles.logoutText]}>
                Terminar Sessão
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

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
          style={styles.navItem}
          onPress={() => handleNavigation('locations')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📍</Text>
          </View>
          <Text style={styles.navText}>Locais</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleNavigation('profile')}
        >
          <View style={styles.navIconActive}>
            <Text style={styles.navIconText}>👤</Text>
          </View>
          <Text style={styles.navTextActive}>Perfil</Text>
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 8,
  },
  logoutCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
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

export default ProfileScreen;