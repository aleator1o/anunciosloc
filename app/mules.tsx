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
  Alert,
  RefreshControl,
  Switch,
  TextInput,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import {
  getMuleConfig,
  updateMuleConfig,
  getMuleMessages,
  deliverMuleMessage,
  MuleConfig,
  MuleMessage,
} from './lib/api';

const MulesScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'config' | 'messages'>('config');
  const [config, setConfig] = useState<MuleConfig | null>(null);
  const [messages, setMessages] = useState<MuleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [maxSpaceMB, setMaxSpaceMB] = useState('10');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, [token, activeTab]);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      if (activeTab === 'config') {
        const res = await getMuleConfig(token);
        setConfig(res.config);
        setMaxSpaceMB(String(Math.round(res.config.maxSpaceBytes / 1024 / 1024)));
        setIsActive(res.config.isActive);
      } else {
        const res = await getMuleMessages(token);
        setMessages(res.messages);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    try {
      const maxSpaceBytes = parseInt(maxSpaceMB) * 1024 * 1024;
      if (isNaN(maxSpaceBytes) || maxSpaceBytes <= 0) {
        Alert.alert('Erro', 'Espaço máximo deve ser um número positivo');
        return;
      }
      setLoading(true);
      const res = await updateMuleConfig(token, maxSpaceBytes, isActive);
      setConfig(res.config);
      Alert.alert('Sucesso', 'Configuração salva com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (muleMessageId: string) => {
    if (!token) return;
    Alert.alert(
      'Entregar Mensagem',
      'Tem certeza que deseja entregar esta mensagem? Você deve estar no mesmo local que o destino.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entregar',
          onPress: async () => {
            try {
              setLoading(true);
              await deliverMuleMessage(token, muleMessageId);
              Alert.alert('Sucesso', 'Mensagem entregue com sucesso');
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao entregar mensagem');
            } finally {
              setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'IN_TRANSIT':
        return '#2196F3';
      case 'DELIVERED':
        return '#4CAF50';
      case 'EXPIRED':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'IN_TRANSIT':
        return 'Em Trânsito';
      case 'DELIVERED':
        return 'Entregue';
      case 'EXPIRED':
        return 'Expirada';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mulas</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'config' && styles.tabActive]}
          onPress={() => setActiveTab('config')}
        >
          <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>
            Configuração
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Mensagens ({messages.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {activeTab === 'config' ? (
          <View style={styles.configContainer}>
            <Text style={styles.sectionTitle}>Configuração de Mula</Text>
            <Text style={styles.description}>
              Configure seu dispositivo para transportar mensagens de outros usuários.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ativar função de mula</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Espaço máximo (MB)</Text>
              <TextInput
                style={styles.input}
                value={maxSpaceMB}
                onChangeText={setMaxSpaceMB}
                keyboardType="numeric"
                placeholder="10"
              />
              <Text style={styles.helpText}>
                Espaço disponível para armazenar mensagens em trânsito
              </Text>
            </View>

            {config && (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Status Atual</Text>
                <Text style={styles.infoText}>
                  Espaço máximo: {formatBytes(config.maxSpaceBytes)}
                </Text>
                <Text style={styles.infoText}>
                  Status: {config.isActive ? '✅ Ativo' : '❌ Inativo'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSaveConfig}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Salvar Configuração</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.messagesContainer}>
            <Text style={styles.sectionTitle}>Mensagens em Trânsito</Text>
            <Text style={styles.description}>
              Mensagens que você está transportando para outros usuários.
            </Text>

            {loading && messages.length === 0 ? (
              <Text style={styles.emptyText}>Carregando...</Text>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma mensagem em trânsito</Text>
                <Text style={styles.emptySubtext}>
                  Quando você aceitar transportar uma mensagem, ela aparecerá aqui.
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id} style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(msg.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(msg.status)}</Text>
                    </View>
                    <Text style={styles.messageDate}>
                      {new Date(msg.createdAt).toLocaleDateString('pt-PT')}
                    </Text>
                  </View>

                  {msg.announcement && (
                    <View style={styles.messageContent}>
                      <Text style={styles.messageTitle}>
                        {msg.announcement.content?.substring(0, 100)}
                        {msg.announcement.content?.length > 100 ? '...' : ''}
                      </Text>
                      <Text style={styles.messageAuthor}>
                        De: {msg.announcement.author?.username || 'Desconhecido'}
                      </Text>
                    </View>
                  )}

                  {msg.destinationUser && (
                    <Text style={styles.messageDestination}>
                      Destino: {msg.destinationUser.username}
                    </Text>
                  )}

                  {msg.expiresAt && (
                    <Text style={styles.messageExpiry}>
                      Expira em: {new Date(msg.expiresAt).toLocaleString('pt-PT')}
                    </Text>
                  )}

                  {msg.status === 'PENDING' || msg.status === 'IN_TRANSIT' ? (
                    <TouchableOpacity
                      style={styles.deliverButton}
                      onPress={() => handleDeliver(msg.id)}
                      disabled={loading}
                    >
                      <Text style={styles.deliverButtonText}>Entregar Mensagem</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  configContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#757575',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageDate: {
    fontSize: 12,
    color: '#757575',
  },
  messageContent: {
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 14,
    color: '#757575',
  },
  messageDestination: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  messageExpiry: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 12,
  },
  deliverButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deliverButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MulesScreen;

