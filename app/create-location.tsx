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
  Alert,
} from 'react-native';

const CreateLocationScreen = () => {
  const router = useRouter();
  const [locationType, setLocationType] = useState<'GPS' | 'WiFi/BLE'>('GPS');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [category, ] = useState('');
  const [latitude, setLatitude] = useState('-8.8139');
  const [longitude, setLongitude] = useState('13.2319');
  const [radius, setRadius] = useState('50');
  const [wifiIds, setWifiIds] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowAnnouncements, setAllowAnnouncements] = useState(false);

  const categories = [
    'Comércio',
    'Educação',
    'Desporto',
    'Saúde',
    'Restaurante',
    'Entretenimento',
    'Transporte',
    'Outro',
  ];

  const handleUseCurrentLocation = () => {
    // Simular obtenção de localização atual
    Alert.alert('Localização', 'Usando localização atual...');
    setLatitude('-8.8139');
    setLongitude('13.2319');
  };

  const handleCreateLocation = () => {
    if (!locationName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do local');
      return;
    }

    if (locationType === 'GPS') {
      if (!latitude || !longitude || !radius) {
        Alert.alert('Erro', 'Preencha todas as coordenadas GPS');
        return;
      }
    } else {
      if (!wifiIds.trim()) {
        Alert.alert('Erro', 'Insira pelo menos um identificador WiFi/BLE');
        return;
      }
    }

    Alert.alert(
      'Sucesso',
      'Local criado com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Criar Local</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome do Local</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Praça da República"
              placeholderTextColor="#9CA3AF"
              value={locationName}
              onChangeText={setLocationName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva o local..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={category ? styles.selectText : styles.selectPlaceholder}>
                {category || 'Selecionar categoria'}
              </Text>
              <Text style={styles.chevron}>⌄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Localização</Text>
          
          <View style={styles.typeButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                locationType === 'GPS' && styles.typeButtonActive,
              ]}
              onPress={() => setLocationType('GPS')}
            >
              <Text style={styles.typeButtonTitle}>GPS</Text>
              <Text style={styles.typeButtonSubtitle}>
                Coordenadas geográficas
              </Text>
              {locationType === 'GPS' && (
                <View style={styles.radioButton}>
                  <View style={styles.radioButtonInner} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                locationType === 'WiFi/BLE' && styles.typeButtonActive,
              ]}
              onPress={() => setLocationType('WiFi/BLE')}
            >
              <Text style={styles.typeButtonTitle}>WiFi/BLE</Text>
              <Text style={styles.typeButtonSubtitle}>
                Identificadores de rede
              </Text>
              {locationType === 'WiFi/BLE' && (
                <View style={styles.radioButton}>
                  <View style={styles.radioButtonInner} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS Coordinates Section */}
        {locationType === 'GPS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coordenadas GPS</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="-8.8139"
                  placeholderTextColor="#9CA3AF"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="13.2319"
                  placeholderTextColor="#9CA3AF"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Raio (metros)</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                placeholderTextColor="#9CA3AF"
                value={radius}
                onChangeText={setRadius}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Text style={styles.currentLocationIcon}>📍</Text>
              <Text style={styles.currentLocationText}>
                Usar localização atual
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WiFi/BLE Section */}
        {locationType === 'WiFi/BLE' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificadores WiFi/BLE</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                IDs (separados por vírgula)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="wifi-ssid-1, beacon-uuid-2, ble-mac-address"
                placeholderTextColor="#9CA3AF"
                value={wifiIds}
                onChangeText={setWifiIds}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helperText}>
                Adicione os identificadores de rede WiFi ou BLE
              </Text>
            </View>
          </View>
        )}

        {/* Visibility Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações de Visibilidade</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Local público</Text>
              <Text style={styles.settingDescription}>
                Outros usuários podem ver este local
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Permitir anúncios</Text>
              <Text style={styles.settingDescription}>
                Outros podem criar anúncios neste local
              </Text>
            </View>
            <Switch
              value={allowAnnouncements}
              onValueChange={setAllowAnnouncements}
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateLocation}
        >
          <Text style={styles.createButtonText}>Criar Local</Text>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
  },
  selectPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 20,
    color: '#6B7280',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  typeButtonActive: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },
  typeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  radioButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06B6D4',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  currentLocationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#06B6D4',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateLocationScreen;