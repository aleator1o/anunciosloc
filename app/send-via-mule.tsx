import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { getAvailableMules, sendViaMule, getMuleMessages, AvailableMule } from './lib/api';
import { api } from './lib/api';

const SendViaMuleScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();
  const announcementId = params.announcementId as string;
  
  const [mules, setMules] = useState<AvailableMule[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [destinationUserId, setDestinationUserId] = useState('');
  const [destinationUsername, setDestinationUsername] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; username: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  useEffect(() => {
    if (announcementId && token) {
      loadAnnouncement();
      loadUsers();
      // Não carregar mulas automaticamente - só quando usuário destino for selecionado
    }
  }, [announcementId, token]);

  // Carregar mulas quando usuário destino for selecionado
  useEffect(() => {
    if (destinationUserId && announcementId && token) {
      loadAvailableMules();
    } else {
      // Limpar lista de mulas se não houver destino selecionado
      setMules([]);
    }
  }, [destinationUserId, announcementId, token]);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setLoadingUsers(true);
      const res = await api.get<{ users: Array<{ id: string; username: string; email: string }> }>('/users', token);
      setUsers(res.users.map(u => ({ id: u.id, username: u.username })));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await api.get<{ announcement: any }>(`/announcements/${announcementId}`, token);
      setAnnouncement(res.announcement);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar anúncio');
    }
  };

  const loadAvailableMules = async () => {
    if (!token || !announcementId) return;
    try {
      setLoading(true);
      const res = await getAvailableMules(token, announcementId);
      setMules(res.mules);
      if (res.mules.length === 0) {
        Alert.alert(
          'Nenhuma Mula Disponível',
          'Não há mulas disponíveis no momento. Verifique se:\n\n' +
          '• Há mulas ativas no mesmo local\n' +
          '• As mulas têm espaço disponível\n' +
          '• Você está no local do anúncio'
        );
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar mulas disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleSendViaMule = async (muleUserId: string, muleUsername: string) => {
    if (!destinationUserId) {
      Alert.alert('Erro', 'Digite o ID do usuário destino');
      return;
    }

    Alert.alert(
      'Enviar via Mula',
      `Enviar mensagem via ${muleUsername} para usuário ${destinationUsername || destinationUserId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              setSending(true);
              await sendViaMule(token!, announcementId, muleUserId, destinationUserId);
              Alert.alert('Sucesso', 'Mensagem enviada via mula com sucesso!', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao enviar via mula');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Enviar via Mula</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {announcement && (
          <View style={styles.announcementBox}>
            <Text style={styles.announcementTitle}>Anúncio:</Text>
            <Text style={styles.announcementContent}>
              {announcement.content?.substring(0, 100)}
              {announcement.content?.length > 100 ? '...' : ''}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuário Destino</Text>
          <Text style={styles.label}>Selecione o usuário destino:</Text>
          
          {destinationUserId ? (
            <View style={styles.selectedUser}>
              <Text style={styles.selectedUserText}>
                ✅ {destinationUsername || 'Usuário selecionado'}
              </Text>
              <Text style={styles.selectedUserId}>ID: {destinationUserId}</Text>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setDestinationUserId('');
                  setDestinationUsername('');
                  setShowUserPicker(true);
                }}
              >
                <Text style={styles.changeButtonText}>Alterar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {showUserPicker ? (
                <View style={styles.userPicker}>
                  {loadingUsers ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <>
                      {users.map((u) => (
                        <TouchableOpacity
                          key={u.id}
                          style={styles.userOption}
                          onPress={() => {
                            setDestinationUserId(u.id);
                            setDestinationUsername(u.username);
                            setShowUserPicker(false);
                            // Mulas serão carregadas automaticamente pelo useEffect
                          }}
                        >
                          <Text style={styles.userOptionText}>{u.username}</Text>
                          <Text style={styles.userOptionId}>{u.id}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowUserPicker(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowUserPicker(true)}
                >
                  <Text style={styles.selectButtonText}>Selecionar Usuário</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mulas Disponíveis</Text>
          {!destinationUserId ? (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                👆 Selecione um usuário destino acima para ver as mulas disponíveis
              </Text>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Carregando mulas...</Text>
            </View>
          ) : mules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma mula disponível no momento</Text>
              <View style={styles.troubleshootingBox}>
                <Text style={styles.troubleshootingTitle}>🔍 Por que não aparecem mulas?</Text>
                <Text style={styles.troubleshootingText}>
                  Para uma mula aparecer, ela precisa:{'\n\n'}
                  ✅ Ter função de mula ATIVADA{'\n'}
                  ✅ Estar no MESMO LOCAL que você{'\n'}
                  ✅ Ter espaço disponível{'\n'}
                  ✅ Não estar transportando esta mensagem{'\n\n'}
                  <Text style={styles.troubleshootingBold}>Como resolver:</Text>{'\n'}
                  1. Outro usuário deve ativar função de mula{'\n'}
                  2. Mula deve estar no mesmo local do anúncio{'\n'}
                  3. Você também deve estar no local do anúncio{'\n'}
                  4. Abra a tela "Anúncios" para atualizar localização
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={loadAvailableMules}>
                <Text style={styles.refreshButtonText}>🔄 Atualizar Lista</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {mules.map((mule) => (
                <View key={mule.userId} style={styles.muleCard}>
                  <View style={styles.muleHeader}>
                    <Text style={styles.muleName}>📦 {mule.username}</Text>
                    <Text style={styles.muleSpace}>
                      {formatBytes(mule.availableSpaceBytes)} disponível
                    </Text>
                  </View>
                  <View style={styles.muleInfo}>
                    <Text style={styles.muleInfoText}>
                      Espaço máximo: {formatBytes(mule.maxSpaceBytes)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={() => handleSendViaMule(mule.userId, mule.username)}
                    disabled={sending || !destinationUserId}
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>Enviar via esta Mula</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Como Funciona</Text>
          <Text style={styles.infoText}>
            1. Escolha uma mula disponível no mesmo local{'\n'}
            2. Digite o ID do usuário destino{'\n'}
            3. A mula receberá a mensagem para transportar{'\n'}
            4. Quando a mula chegar ao local de destino, ela pode entregar a mensagem
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  announcementBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#1976D2',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 18,
  },
  selectedUser: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 12,
  },
  selectedUserText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  selectedUserId: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  changeButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userPicker: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 300,
    marginBottom: 12,
  },
  userOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userOptionId: {
    fontSize: 12,
    color: '#757575',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 20,
  },
  troubleshootingBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 12,
  },
  troubleshootingText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 20,
  },
  troubleshootingBold: {
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  muleCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  muleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  muleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  muleSpace: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  muleInfo: {
    marginBottom: 12,
  },
  muleInfoText: {
    fontSize: 12,
    color: '#757575',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
});

export default SendViaMuleScreen;

