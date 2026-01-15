import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { api, fetchPublicProfileKeys } from './lib/api';
import { p2pService } from './lib/p2pService';

const NewAnnouncementScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [policyType, setPolicyType] = useState<'WHITELIST' | 'BLACKLIST'>('WHITELIST');
  const [restrictions, setRestrictions] = useState<Array<{ key: string; value: string }>>([]);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const res = await fetchPublicProfileKeys();
        setAvailableKeys(res.keys);
      } catch {}
    };
    loadKeys();
  }, []);
  const [message, setMessage] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'CENTRALIZED' | 'DECENTRALIZED'>('CENTRALIZED');
  const [publishNow, setPublishNow] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      if (!token) return;
      try {
        setLoadingLocations(true);
        // Carregar locais próprios + locais públicos
        const res = await api.get<{ locations: Array<{ id: string; name: string }> }>('/locations?includePublic=true', token);
        setLocations(res.locations || []);
      } catch (err) {
        console.error('Erro ao carregar locais:', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    loadLocations();
  }, [token]);

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectLocation = (locationId: string, locationName: string) => {
    setSelectedLocation(locationId);
    setSelectedLocationName(locationName);
    setShowLocationPicker(false);
  };

  const handlePublish = async () => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Erro', 'Escreva a mensagem do anúncio');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(
        '/announcements',
        {
          content: message,
          deliveryMode,
          visibility: 'PUBLIC', // Sempre público - a política de destinatários controla quem vê
          policyType,
          policyRestrictions: restrictions.filter(r => r.key.trim() && r.value.trim()),
          locationId: selectedLocation.trim() || undefined,
          startsAt: publishNow || !startDate ? undefined : new Date(startDate).toISOString(),
          endsAt: publishNow || !endDate ? undefined : new Date(endDate).toISOString(),
        },
        token,
      );

      // Se for anúncio descentralizado, adicionar ao cache P2P
      if (deliveryMode === 'DECENTRALIZED') {
        try {
          // Buscar o anúncio criado para adicionar ao cache
          const response = await api.get<{ announcements: any[] }>('/announcements', token);
          const createdAnnouncement = response.announcements.find(
            (a: any) => a.content === message && a.deliveryMode === 'DECENTRALIZED'
          );
          if (createdAnnouncement) {
            p2pService.addLocalAnnouncement(createdAnnouncement);
            p2pService.startPublishing();
          }
        } catch (err) {
          console.warn('[NewAnnouncement] Erro ao adicionar anúncio ao cache P2P:', err);
        }
      }

      Alert.alert('Sucesso', 'Anúncio publicado com sucesso!', [
        {
          text: 'Ver anúncios',
          onPress: () => router.replace('/announcements'),
        },
      ]);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Não foi possível publicar o anúncio';
      Alert.alert('Erro', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Anúncio</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Message Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensagem</Text>
          <Text style={styles.label}>Conteúdo do Anúncio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Escreva seu anúncio aqui..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <Text style={styles.characterCount}>Máximo 500 caracteres</Text>
        </View>

        {/* Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quem pode ver este anúncio?</Text>
          <Text style={styles.label}>Política de Destinatários</Text>
          
          <View style={styles.visibilityList}>
            <TouchableOpacity 
              style={[styles.visibilityOption, policyType === 'WHITELIST' && styles.visibilityOptionSelected]}
              onPress={() => setPolicyType('WHITELIST')}
            >
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityIcon}>✅</Text>
                <View style={styles.visibilityTextContainer}>
                  <Text style={styles.visibilityTitle}>Whitelist (Lista Branca)</Text>
                  <Text style={styles.visibilityDescription}>
                    Apenas utilizadores que correspondem às restrições de perfil podem ver este anúncio
                  </Text>
                </View>
              </View>
              <View style={[styles.radioCircle, policyType === 'WHITELIST' && styles.radioCircleSelected]}>
                {policyType === 'WHITELIST' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.visibilityOption, policyType === 'BLACKLIST' && styles.visibilityOptionSelected]}
              onPress={() => setPolicyType('BLACKLIST')}
            >
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityIcon}>⛔</Text>
                <View style={styles.visibilityTextContainer}>
                  <Text style={styles.visibilityTitle}>Blacklist (Lista Negra)</Text>
                  <Text style={styles.visibilityDescription}>
                    Todos os utilizadores podem ver, exceto os que correspondem às restrições de perfil
                  </Text>
                </View>
              </View>
              <View style={[styles.radioCircle, policyType === 'BLACKLIST' && styles.radioCircleSelected]}>
                {policyType === 'BLACKLIST' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {restrictions.length === 0 && (
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityInfoText}>
                {policyType === 'WHITELIST' 
                  ? '⚠️ Whitelist sem restrições: Ninguém poderá ver este anúncio (lista branca vazia = nenhum permitido). Adicione restrições para permitir acesso.'
                  : 'ℹ️ Blacklist sem restrições: Todos os utilizadores poderão ver este anúncio (lista negra vazia = nenhum bloqueado). Adicione restrições para bloquear utilizadores específicos.'}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 8 }]}>Restrições (pares chave-valor)</Text>
          {restrictions.map((r, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[styles.textArea, { flex: 1, minHeight: undefined, paddingVertical: 10 }]}
                placeholder="Chave (ex.: Profissao)"
                placeholderTextColor="#9CA3AF"
                value={r.key}
                onChangeText={(t) => {
                  const copy = [...restrictions];
                  copy[idx] = { ...copy[idx], key: t };
                  setRestrictions(copy);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.textArea, { flex: 1, minHeight: undefined, paddingVertical: 10 }]}
                placeholder="Valor (ex.: Estudante)"
                placeholderTextColor="#9CA3AF"
                value={r.value}
                onChangeText={(t) => {
                  const copy = [...restrictions];
                  copy[idx] = { ...copy[idx], value: t };
                  setRestrictions(copy);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setRestrictions(restrictions.filter((_, i) => i !== idx))}
                style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center' }}
              >
                <Text style={{ color: '#DC2626', fontWeight: '600' }}>Rem</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setRestrictions([...restrictions, { key: '', value: '' }])}
              style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ color: '#111827', fontWeight: '600' }}>+ Adicionar restrição</Text>
            </TouchableOpacity>
            {availableKeys.length > 0 && (
              <View style={{ justifyContent: 'center' }}>
                <Text style={{ color: '#6B7280' }}>Chaves conhecidas: {availableKeys.slice(0, 5).join(', ')}...</Text>
              </View>
            )}
          </View>
        </View>
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <Text style={styles.label}>Local de Destino (opcional)</Text>
          
          {selectedLocation ? (
            <View style={styles.selectedLocationContainer}>
              <Text style={styles.selectedLocationText}>{selectedLocationName}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedLocation('');
                  setSelectedLocationName('');
                }}
                style={styles.removeLocationButton}
              >
                <Text style={styles.removeLocationText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <Text style={[styles.dropdownText, !selectedLocation && { color: '#9CA3AF' }]}>
                {loadingLocations ? 'Carregando locais...' : 'Selecionar local'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          )}

          {showLocationPicker && !selectedLocation && (
            <View style={styles.locationPicker}>
              {locations.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum local disponível</Text>
              ) : (
                locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.locationOption}
                    onPress={() => handleSelectLocation(loc.id, loc.name)}
                  >
                    <Text style={styles.locationOptionText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.locationOption}
                onPress={() => {
                  setShowLocationPicker(false);
                  router.push('/create-location');
                }}
              >
                <Text style={[styles.locationOptionText, { color: '#06B6D4', fontWeight: '600' }]}>
                  + Criar novo local
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>


        {/* Delivery Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de Entrega</Text>
          
          <TouchableOpacity 
            style={[styles.radioOption, deliveryMode === 'CENTRALIZED' && styles.radioOptionSelected]}
            onPress={() => setDeliveryMode('CENTRALIZED')}
          >
            <View style={styles.radioContent}>
              <Text style={styles.radioIcon}>🌐</Text>
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Centralizada</Text>
                <Text style={styles.radioDescription}>
                  Entrega através do servidor (mais rápida)
                </Text>
              </View>
            </View>
            <View style={[styles.radioCircle, deliveryMode === 'CENTRALIZED' && styles.radioCircleSelected]}>
              {deliveryMode === 'CENTRALIZED' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, deliveryMode === 'DECENTRALIZED' && styles.radioOptionSelected]}
            onPress={() => setDeliveryMode('DECENTRALIZED')}
          >
            <View style={styles.radioContent}>
              <Text style={styles.radioIcon}>📡</Text>
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Descentralizada</Text>
                <Text style={styles.radioDescription}>
                  WiFi Direct peer-to-peer (mais privada)
                </Text>
              </View>
            </View>
            <View style={[styles.radioCircle, deliveryMode === 'DECENTRALIZED' && styles.radioCircleSelected]}>
              {deliveryMode === 'DECENTRALIZED' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Scheduling Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agendamento</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Publicar agora</Text>
            <Switch
              value={publishNow}
              onValueChange={setPublishNow}
              trackColor={{ false: '#D1D5DB', true: '#06B6D4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {!publishNow && (
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Data de início</Text>
                <TouchableOpacity style={styles.dateInput}>
                  <Text style={styles.dateInputText}>
                    {startDate || 'Selecionar'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Data de fim</Text>
                <TouchableOpacity style={styles.dateInput}>
                  <Text style={styles.dateInputText}>
                    {endDate || 'Selecionar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
          <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.publishButtonText}>Publicar Anúncio</Text>
          )}
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1F2937',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  selectedLocationText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  removeLocationButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeLocationText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  locationPicker: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  locationOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationOptionText: {
    fontSize: 15,
    color: '#1F2937',
  },
  emptyText: {
    padding: 16,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  visibilityList: {
    gap: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  visibilityOptionSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },
  visibilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visibilityIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  visibilityTextContainer: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  visibilityInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  visibilityInfoText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioOptionSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#06B6D4',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#06B6D4',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  dateInputText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NewAnnouncementScreen;