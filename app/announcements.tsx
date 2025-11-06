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
} from 'react-native';

const AnnouncementsScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const announcements = [
    {
      id: 1,
      author: 'Alice Silva',
      avatar: '👩',
      verified: true,
      location: 'Largo da Independência',
      time: 'há 2 horas',
      content: 'Olá pessoal! Estou a organizar um evento de limpeza comunitária no Largo da Independência este sábado às 10h. Vamos focar na área perto do lago. Os materiais serão fornecidos, mas podem trazer as suas próprias luvas se tiverem. Vamos tornar o nosso parque mais bonito juntos! 🌱',
      likes: 23,
      comments: 5,
      bookmarked: true,
    },
    {
      id: 2,
      author: 'João Santos',
      avatar: '👨',
      verified: false,
      badge: 'Vendedor',
      location: 'Belas Shopping',
      time: 'há 4 horas',
      content: 'Vendo iPhone 13 Pro Max em excelente estado. Preço negociável. Interessados contactem por WhatsApp: +244 923 456 789. Também aceito troca por Samsung Galaxy S21. 📱',
      likes: 0,
      comments: 0,
      bookmarked: false,
    },
  ];

  const handleGoBack = () => {
    router.back();
  };

  const handleNewAnnouncement = () => {
    router.push('/new-announcement');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
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
        {announcements.map((announcement) => (
          <View key={announcement.id} style={styles.announcementCard}>
            {/* Header */}
            <View style={styles.announcementHeader}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{announcement.avatar}</Text>
                </View>
                <View style={styles.authorDetails}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{announcement.author}</Text>
                    {announcement.verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>Verificado</Text>
                      </View>
                    )}
                    {announcement.badge && (
                      <View style={styles.sellerBadge}>
                        <Text style={styles.sellerText}>{announcement.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timeText}>{announcement.time}</Text>
                </View>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{announcement.location}</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.announcementContent}>{announcement.content}</Text>

            {/* Footer */}
            <View style={styles.announcementFooter}>
              <View style={styles.footerLeft}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>{announcement.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>{announcement.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>🔖</Text>
                  <Text style={styles.actionText}>{announcement.bookmarked ? '1' : ''}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeMoreText}>Ver mais</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🏠</Text>
          </View>
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.navIconActive}>
            <Text style={styles.navIconText}>📢</Text>
          </View>
          <Text style={styles.navTextActive}>Anúncios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📍</Text>
          </View>
          <Text style={styles.navText}>Locais</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
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