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
  Switch,
} from 'react-native';

const NewAnnouncementScreen = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('centralized');
  const [visibility, setVisibility] = useState('public');
  const [publishNow, setPublishNow] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleGoBack = () => {
    router.back();
  };

  const handlePublish = () => {
    console.log('Publishing announcement:', {
      message,
      deliveryMode,
      visibility,
      publishNow,
      startDate,
      endDate,
      selectedLocation,
    });
    // Implementar lógica de publicação
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

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <Text style={styles.label}>Local de Destino</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {selectedLocation || 'Selecionar um local'}
            </Text>
            <Text style={styles.dropdownIcon}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Políticas de Visibilidade</Text>
          <Text style={styles.label}>Quem pode ver este anúncio?</Text>
          
          <TouchableOpacity 
            style={[styles.radioOption, visibility === 'public' && styles.radioOptionSelected]}
            onPress={() => setVisibility('public')}
          >
            <View style={styles.radioContent}>
              <Text style={styles.radioIcon}>🌍</Text>
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Público (todos podem ver)</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, visibility === 'public' && styles.radioCircleSelected]}>
              {visibility === 'public' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Delivery Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de Entrega</Text>
          
          <TouchableOpacity 
            style={[styles.radioOption, deliveryMode === 'centralized' && styles.radioOptionSelected]}
            onPress={() => setDeliveryMode('centralized')}
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
            <View style={[styles.radioCircle, deliveryMode === 'centralized' && styles.radioCircleSelected]}>
              {deliveryMode === 'centralized' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, deliveryMode === 'decentralized' && styles.radioOptionSelected]}
            onPress={() => setDeliveryMode('decentralized')}
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
            <View style={[styles.radioCircle, deliveryMode === 'decentralized' && styles.radioCircleSelected]}>
              {deliveryMode === 'decentralized' && <View style={styles.radioInner} />}
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
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
          <Text style={styles.publishButtonText}>Publicar Anúncio</Text>
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
    color: '#6B7280',
  },
  dropdownIcon: {
    fontSize: 24,
    color: '#9CA3AF',
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