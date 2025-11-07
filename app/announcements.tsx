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
import { api } from './lib/api';
import { Announcement } from '../types/api';

const AnnouncementsScreen = () => {
  const router = useRouter();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'nearby' | 'recent'>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filteredAnnouncements = useMemo(() => {
    if (activeTab === 'recent') {
      return [...announcements].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    // Para 'nearby' e 'all', por agora devolvemos a lista completa.
    return announcements;
  }, [announcements, activeTab]);

  const toggleLike = async (announcement: Announcement) => {
    if (!token) return;

    const isLiked = announcement.reactions.some((reaction) => reaction.userId === user?.id);

    try {
      if (isLiked) {
        await api.delete(`/announcements/${announcement.id}/like`, token);
      } else {
        await api.post(`/announcements/${announcement.id}/like`, {}, token);
      }

      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                reactions: isLiked
                  ? item.reactions.filter((reaction) => reaction.userId !== user?.id)
                  : [...item.reactions, { id: `${Date.now()}`, userId: user?.id ?? '', type: 'LIKE' }],
              }
            : item,
        ),
      );
    } catch (err) {
      Alert.alert('Erro', (err as Error).message ?? 'Não foi possível atualizar o like');
    }
  };

  const toggleBookmark = async (announcement: Announcement) => {
    if (!token) return;

    const isBookmarked = announcement.bookmarks.some((bookmark) => bookmark.userId === user?.id);

    try {
      if (isBookmarked) {
        await api.delete(`/announcements/${announcement.id}/bookmark`, token);
      } else {
        await api.post(`/announcements/${announcement.id}/bookmark`, {}, token);
      }

      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                bookmarks: isBookmarked
                  ? item.bookmarks.filter((bookmark) => bookmark.userId !== user?.id)
                  : [...item.bookmarks, { id: `${Date.now()}`, userId: user?.id ?? '' }],
              }
            : item,
        ),
      );
    } catch (err) {
      Alert.alert('Erro', (err as Error).message ?? 'Não foi possível atualizar o marcador');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        </TouchableOpacity>
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
          style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={styles.tabIcon}>📍</Text>
          <Text style={activeTab === 'nearby' ? styles.tabTextActive : styles.tabText}>Próximos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={styles.tabIcon}>🕐</Text>
          <Text style={activeTab === 'recent' ? styles.tabTextActive : styles.tabText}>Recente</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color="#06B6D4" style={{ marginTop: 24 }} />}

        {error && !loading && (
          <Text style={{ color: '#EF4444', marginHorizontal: 16, marginBottom: 12 }}>{error}</Text>
        )}

        {!loading && !error && filteredAnnouncements.length === 0 && (
          <Text style={{ color: '#6B7280', marginHorizontal: 16 }}>Ainda não há anúncios.</Text>
        )}

        {!loading &&
          !error &&
          filteredAnnouncements.map((announcement) => {
            const isLiked = announcement.reactions.some((reaction) => reaction.userId === user?.id);
            const isBookmarked = announcement.bookmarks.some((bookmark) => bookmark.userId === user?.id);
            const avatar = announcement.author.username.charAt(0).toUpperCase();

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
                        <Text style={styles.authorName}>{announcement.author.username}</Text>
                      </View>
                      <Text style={styles.timeText}>
                        {new Date(announcement.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {announcement.location && (
                    <View style={styles.locationBadge}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{announcement.location.name}</Text>
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
                      <Text style={styles.actionText}>{announcement.reactions.length}</Text>
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
                  <TouchableOpacity onPress={() => router.push(`/announcement/${announcement.id}`)}>
                    <Text style={styles.seeMoreText}>Ver mais</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        <View style={{ height: 100 }} />
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
  },
  addIcon: {
    fontSize: 32,
    color: '#06B6D4',
    fontWeight: '300',
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
    borderRadius: 6,
    alignSelf: 'flex-start',
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