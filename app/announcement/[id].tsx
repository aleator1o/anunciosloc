import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Announcement } from '../../types/api';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ announcement: Announcement }>(`/announcements/${id}`, token);
        setAnnouncement(response.announcement);
      } catch (err) {
        Alert.alert('Erro', (err as Error).message ?? 'Anúncio não encontrado', [
          {
            text: 'Voltar',
            onPress: () => router.replace('/announcements'),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, token, router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhe do Anúncio</Text>
        <TouchableOpacity onPress={() => router.push('/edit-announcement')} style={styles.actionRight}>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#06B6D4" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {announcement && (
            <View style={styles.card}>
              <Text style={styles.meta}>ID: {announcement.id}</Text>
              <Text style={styles.title}>{announcement.author.username}</Text>
              <Text style={styles.subtitle}>
                {announcement.location ? announcement.location.name : 'Sem local associado'} •
                {' '}
                {new Date(announcement.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.body}>{announcement.content}</Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#1F2937' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  actionRight: { paddingHorizontal: 8, paddingVertical: 4 },
  actionText: { color: '#06B6D4', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  meta: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 },
});


