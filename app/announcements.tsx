import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { api, fetchAvailableAnnouncements, receiveAnnouncement, fetchDecentralizedAnnouncements } from './lib/api';
import { Announcement } from '../types/api';
import { locationService, getCurrentGPSLocation, getCurrentWiFiIds } from './lib/locationService';
import { notificationService } from './lib/notificationService';
import { p2pService } from './lib/p2pService';

const AnnouncementsScreen = () => {
  const router = useRouter();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'recent' | 'p2p'>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [availableAnnouncements, setAvailableAnnouncements] = useState<Announcement[]>([]);
  const [p2pAnnouncements, setP2pAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNavigation = (tab: string) => {
    if (tab === 'home') {
      router.push('/home');
    } else if (tab === 'locations') {
      router.push('/locations');
    } else if (tab === 'profile') {
      router.push('/profile');
    }
  };

  const handleNewAnnouncement = () => {
    router.push('/new-announcement');
  };

  // Carregar anúncios gerais
  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ announcements: Announcement[] }>('/announcements', token);
        setAnnouncements(response.announcements);
      } catch (err) {
        setError((err as Error).message ?? 'Não foi possível carregar os anúncios');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [token, router]);

  // Inicializar serviço de localização, notificações e carregar anúncios disponíveis
  useEffect(() => {
    if (!token) return;

    const initializeLocation = async () => {
      try {
        // Tentar obter GPS
        const gpsLocation = await getCurrentGPSLocation();
        const wifiIds = await getCurrentWiFiIds();

        // Se tiver GPS, iniciar serviço de localização
        if (gpsLocation) {
          locationService.start(token, {
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            wifiIds: wifiIds.length > 0 ? wifiIds : undefined,
          });
        } else {
          // Sem GPS, ainda podemos usar WiFi IDs se disponíveis
          if (wifiIds.length > 0) {
            locationService.start(token, { wifiIds });
          }
        }
      } catch (error) {
        console.warn('[Announcements] Erro ao inicializar localização:', error);
      }
    };

    initializeLocation();

    // Configurar callback para verificar notificações quando a localização for enviada
    locationService.setOnLocationSentCallback(async (location) => {
      console.log('[Announcements] Localização enviada, verificando notificações...');
      // Aguardar um pouco para garantir que o backend processou a localização
      setTimeout(async () => {
        if (token) {
          await notificationService.checkNow();
        }
      }, 3000); // 3 segundos após envio da localização
    });

    // Iniciar serviço de notificações (verificar a cada 30 segundos)
    notificationService.start(token, 30000);

    // Iniciar serviço P2P
    if (user?.id) {
      p2pService.start(token, user.id);
      
      // Carregar anúncios descentralizados do usuário
      const loadDecentralized = async () => {
        try {
          const response = await fetchDecentralizedAnnouncements(token);
          response.announcements.forEach((announcement: Announcement) => {
            p2pService.addLocalAnnouncement(announcement);
          });
          
          // Iniciar publicação se houver anúncios descentralizados
          if (response.announcements.length > 0) {
            p2pService.startPublishing();
          }
        } catch (err) {
          console.error('[Announcements] Erro ao carregar anúncios descentralizados:', err);
        }
      };
      
      loadDecentralized();
    }

    // Carregar anúncios disponíveis
    const loadAvailable = async () => {
      try {
        setLoadingAvailable(true);
        const response = await fetchAvailableAnnouncements(token);
        setAvailableAnnouncements(response.announcements || []);
        
        // Verificar se há novas mensagens e notificar
        await notificationService.checkNow();
      } catch (err) {
        console.error('[Announcements] Erro ao carregar disponíveis:', err);
      } finally {
        setLoadingAvailable(false);
      }
    };

    loadAvailable();

    // Atualizar anúncios disponíveis periodicamente (a cada 30s)
    // E verificar notificações após cada atualização
    const interval = setInterval(async () => {
      await loadAvailable();
      // Após carregar disponíveis, verificar notificações
      await notificationService.checkNow();
    }, 30000);

    // Verificar mensagens P2P recebidas periodicamente
    const p2pCheckInterval = setInterval(async () => {
      // Em produção, isso seria uma callback de API nativa
      // Por enquanto, verificar anúncios P2P recebidos do cache local
      const receivedP2p = p2pService.getReceivedAnnouncements();
      setP2pAnnouncements(receivedP2p);
    }, 5000);

    return () => {
      locationService.stop();
      notificationService.stop();
      p2pService.stop();
      clearInterval(interval);
      clearInterval(p2pCheckInterval);
    };
  }, [token, user]);

  const filteredAnnouncements = useMemo(() => {
    if (activeTab === 'available') {
      return availableAnnouncements;
    }
    if (activeTab === 'p2p') {
      return p2pAnnouncements;
    }
    if (activeTab === 'recent') {
      return [...announcements].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    // Para 'all', devolvemos a lista completa (incluindo P2P se houver)
    return [...announcements, ...p2pAnnouncements];
  }, [announcements, availableAnnouncements, p2pAnnouncements, activeTab]);

  const toggleLike = async (announcement: Announcement) => {
    if (!token) return;

    const reactions = announcement.reactions || [];
    const isLiked = reactions.some((reaction) => reaction.userId === user?.id);

    try {
      if (isLiked) {
        await api.delete(`/announcements/${announcement.id}/like`, token);
      } else {
        await api.post(`/announcements/${announcement.id}/like`, {}, token);
      }

      setAnnouncements((prev) =>
        prev.map((item) => {
          const itemReactions = item.reactions || [];
          return item.id === announcement.id
            ? {
                ...item,
                reactions: isLiked
                  ? itemReactions.filter((reaction) => reaction.userId !== user?.id)
                  : [...itemReactions, { id: `${Date.now()}`, userId: user?.id ?? '', type: 'LIKE' }],
              }
            : item;
        }),
      );
    } catch (err) {
      Alert.alert('Erro', (err as Error).message ?? 'Não foi possível atualizar o like');
    }
  };

  const toggleBookmark = async (announcement: Announcement) => {
    if (!token) return;

    const bookmarks = announcement.bookmarks || [];
    const isBookmarked = bookmarks.some((bookmark) => bookmark.userId === user?.id);

    try {
      if (isBookmarked) {
        await api.delete(`/announcements/${announcement.id}/bookmark`, token);
      } else {
        await api.post(`/announcements/${announcement.id}/bookmark`, {}, token);
      }

      setAnnouncements((prev) =>
        prev.map((item) => {
          const itemBookmarks = item.bookmarks || [];
          return item.id === announcement.id
            ? {
                ...item,
                bookmarks: isBookmarked
                  ? itemBookmarks.filter((bookmark) => bookmark.userId !== user?.id)
                  : [...itemBookmarks, { id: `${Date.now()}`, userId: user?.id ?? '' }],
              }
            : item;
        }),
      );
    } catch (err) {
      Alert.alert('Erro', (err as Error).message ?? 'Não foi possível atualizar o marcador');
    }
  };

  const handleReceive = async (announcement: Announcement) => {
    if (!token) return;

    try {
      await receiveAnnouncement(token, announcement.id);
      Alert.alert('Sucesso', 'Mensagem recebida! Ela permanecerá disponível mesmo se você sair do local.');
      
      // Remover da lista de disponíveis e adicionar à lista geral
      setAvailableAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
      setAnnouncements((prev) => {
        if (prev.some((a) => a.id === announcement.id)) {
          return prev;
        }
        return [announcement, ...prev];
      });
    } catch (err) {
      Alert.alert('Erro', (err as Error).message ?? 'Não foi possível receber a mensagem');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Anúncios</Text>
        <TouchableOpacity onPress={handleNewAnnouncement} style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={styles.tabIcon}>∞</Text>
          <Text style={activeTab === 'all' ? styles.tabTextActive : styles.tabText}>Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <View style={{ position: 'relative' }}>
            <Text style={styles.tabIcon}>📍</Text>
            {availableAnnouncements.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{availableAnnouncements.length}</Text>
              </View>
            )}
          </View>
          <Text style={activeTab === 'available' ? styles.tabTextActive : styles.tabText}>
            Disponíveis
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={styles.tabIcon}>🕐</Text>
          <Text style={activeTab === 'recent' ? styles.tabTextActive : styles.tabText}>Recente</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'p2p' && styles.tabActive]}
          onPress={() => setActiveTab('p2p')}
        >
          <View style={{ position: 'relative' }}>
            <Text style={styles.tabIcon}>📡</Text>
            {p2pAnnouncements.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{p2pAnnouncements.length}</Text>
              </View>
            )}
          </View>
          <Text style={activeTab === 'p2p' ? styles.tabTextActive : styles.tabText}>P2P</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(loading || (activeTab === 'available' && loadingAvailable)) && (
          <ActivityIndicator color="#06B6D4" style={{ marginTop: 24 }} />
        )}

        {error && !loading && (
          <Text style={{ color: '#EF4444', marginHorizontal: 16, marginBottom: 12 }}>{error}</Text>
        )}

        {activeTab === 'available' && !loadingAvailable && availableAnnouncements.length === 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>
              📍 Nenhum anúncio disponível no seu local atual
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
              Os anúncios aparecerão aqui quando você estiver em um local com mensagens publicadas
            </Text>
          </View>
        )}

        {activeTab === 'p2p' && p2pAnnouncements.length === 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>
              📡 Nenhum anúncio P2P recebido
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              Anúncios recebidos via WiFi Direct aparecerão aqui
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center' }}>
              Para receber anúncios P2P, certifique-se de que o WiFi Direct está ativo e próximo de outros dispositivos
            </Text>
          </View>
        )}

        {!loading && !error && activeTab !== 'available' && activeTab !== 'p2p' && filteredAnnouncements.length === 0 && (
          <Text style={{ color: '#6B7280', marginHorizontal: 16 }}>Ainda não há anúncios.</Text>
        )}

        {!loading &&
          !error &&
          filteredAnnouncements.map((announcement) => {
            // Garantir que reactions e bookmarks são arrays (podem ser undefined)
            const reactions = announcement.reactions || [];
            const bookmarks = announcement.bookmarks || [];
            const isLiked = reactions.some((reaction) => reaction.userId === user?.id);
            const isBookmarked = bookmarks.some((bookmark) => bookmark.userId === user?.id);
            const avatar = announcement.author?.username?.charAt(0).toUpperCase() || '?';

            return (
              <View key={announcement.id} style={styles.announcementCard}>
                {/* Header */}
                <View style={styles.announcementHeader}>
                  <View style={styles.authorInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{avatar}</Text>
                    </View>
                    <View style={styles.authorDetails}>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>{announcement.author?.username || 'Anônimo'}</Text>
                      </View>
                      <Text style={styles.timeText}>
                        {announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                  {announcement.location && (
                    <View style={styles.locationBadge}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{announcement.location?.name || 'Local desconhecido'}</Text>
                    </View>
                  )}
                  {/* Signature Verification Badge */}
                  {(announcement as any).isVerified !== undefined && (
                    <View style={styles.verificationBadge}>
                      <Text style={styles.verificationIcon}>
                        {(announcement as any).isVerified ? '✅' : '⚠️'}
                      </Text>
                      <Text style={styles.verificationText}>
                        {(announcement as any).isVerified ? 'Verificado' : 'Não verificado'}
                      </Text>
                    </View>
                  )}
                  {/* Mule Delivery Badge */}
                  {(announcement as any).receivedViaMule && (
                    <View style={[styles.verificationBadge, { backgroundColor: '#DCFCE7', marginLeft: 8 }]}>
                      <Text style={styles.verificationIcon}>📦</Text>
                      <Text style={[styles.verificationText, { color: '#166534' }]}>Via Mula</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <Text style={styles.announcementContent}>{announcement.content}</Text>

                {/* Footer */}
                <View style={styles.announcementFooter}>
                  <View style={styles.footerLeft}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleLike(announcement)}
                    >
                      <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                      <Text style={styles.actionText}>{reactions.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionIcon}>💬</Text>
                      <Text style={styles.actionText}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleBookmark(announcement)}
                    >
                      <Text style={styles.actionIcon}>{isBookmarked ? '🔖' : '📄'}</Text>
                      <Text style={styles.actionText}>{isBookmarked ? '1' : ''}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.footerRight}>
                    {activeTab === 'available' && (
                      <TouchableOpacity
                        style={styles.receiveButton}
                        onPress={() => handleReceive(announcement)}
                      >
                        <Text style={styles.receiveButtonText}>✓ Receber</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => router.push(`/announcement/${announcement.id}`)}>
                      <Text style={styles.seeMoreText}>Ver mais</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleNewAnnouncement}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
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
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleNavigation('announcements')}
        >
          <View style={styles.navIconActive}>
            <Text style={styles.navIconText}>📢</Text>
          </View>
          <Text style={styles.navTextActive}>Anúncios</Text>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 20,
  },
  addIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 28,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#06B6D4',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  authorDetails: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  sellerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sellerText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  verificationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  verificationText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  announcementContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#06B6D4',
    fontWeight: '600',
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

export default AnnouncementsScreen;