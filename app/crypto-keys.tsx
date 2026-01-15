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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { generateKeys, getPublicKey, PublicKeyInfo } from './lib/api';

const CryptoKeysScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [publicKeyInfo, setPublicKeyInfo] = useState<PublicKeyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    loadPublicKey();
  }, [token]);

  const loadPublicKey = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getPublicKey(token);
      setPublicKeyInfo(res);
    } catch (error: any) {
      console.error('Erro ao carregar chave pública:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeys = async () => {
    if (!token) return;

    if (!showPasswordInput) {
      // Perguntar se quer criptografar chave privada
      Alert.alert(
        'Criptografar Chave Privada',
        'Deseja criptografar sua chave privada com uma senha? Isso aumenta a segurança, mas você precisará da senha para assinar mensagens.',
        [
          {
            text: 'Sem Senha',
            onPress: () => generateKeysWithPassword(undefined),
            style: 'cancel',
          },
          {
            text: 'Com Senha',
            onPress: () => setShowPasswordInput(true),
          },
        ]
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    generateKeysWithPassword(password);
  };

  const generateKeysWithPassword = async (pwd?: string) => {
    if (!token) return;
    try {
      setGenerating(true);
      await generateKeys(token, pwd);
      Alert.alert('Sucesso', 'Chaves geradas com sucesso! Suas mensagens serão assinadas automaticamente.');
      setPassword('');
      setShowPasswordInput(false);
      loadPublicKey();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao gerar chaves');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    // Em React Native, você precisaria usar @react-native-clipboard/clipboard
    Alert.alert('Chave Pública', text.substring(0, 100) + '...\n\n(Chave copiada para visualização)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assinaturas Digitais</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre Assinaturas Digitais</Text>
          <Text style={styles.description}>
            As assinaturas digitais garantem que suas mensagens foram realmente criadas por você e não foram alteradas.
          </Text>
          <Text style={styles.description}>
            Quando você tem chaves configuradas, suas mensagens são assinadas automaticamente e outros usuários podem verificar a autenticidade.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : publicKeyInfo?.publicKey ? (
          <View style={styles.keysContainer}>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>✅ Chaves Configuradas</Text>
              <Text style={styles.statusText}>
                Suas mensagens estão sendo assinadas automaticamente.
              </Text>
            </View>

            <View style={styles.keyBox}>
              <Text style={styles.keyLabel}>Chave Pública</Text>
              <Text style={styles.keyValue} numberOfLines={3}>
                {publicKeyInfo.publicKey}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(publicKeyInfo.publicKey!)}
              >
                <Text style={styles.copyButtonText}>Ver Chave Completa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Informações</Text>
              <Text style={styles.infoText}>
                • Suas mensagens são assinadas automaticamente
              </Text>
              <Text style={styles.infoText}>
                • Outros usuários podem verificar a autenticidade
              </Text>
              <Text style={styles.infoText}>
                • Se você perder sua chave privada, não poderá assinar novas mensagens
              </Text>
            </View>

            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={() => {
                Alert.alert(
                  'Regenerar Chaves',
                  'Tem certeza? Isso invalidará todas as assinaturas anteriores. Você precisará gerar novas chaves.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Regenerar',
                      style: 'destructive',
                      onPress: () => {
                        setShowPasswordInput(false);
                        setPassword('');
                        handleGenerateKeys();
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.regenerateButtonText}>Regenerar Chaves</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noKeysContainer}>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>❌ Chaves Não Configuradas</Text>
              <Text style={styles.statusText}>
                Você ainda não tem chaves de assinatura. Gere um par de chaves para começar a assinar suas mensagens.
              </Text>
            </View>

            {showPasswordInput && (
              <View style={styles.passwordContainer}>
                <Text style={styles.label}>Senha para Criptografar Chave Privada</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Digite uma senha (opcional)"
                  autoCapitalize="none"
                />
                <Text style={styles.helpText}>
                  A senha protege sua chave privada. Você precisará dela para assinar mensagens.
                </Text>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateButton, generating && styles.buttonDisabled]}
              onPress={handleGenerateKeys}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.generateButtonText}>Gerar Chaves</Text>
              )}
            </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 12,
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
  keysContainer: {
    padding: 16,
  },
  noKeysContainer: {
    padding: 16,
  },
  statusBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  keyBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  keyValue: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  copyButton: {
    padding: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#2196F3',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 4,
    lineHeight: 20,
  },
  passwordContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
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
    marginBottom: 12,
  },
  cancelButton: {
    padding: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regenerateButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CryptoKeysScreen;

