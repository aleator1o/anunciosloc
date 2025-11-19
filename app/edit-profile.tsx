import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from './context/AuthContext';
import { deleteProfileAttribute, fetchProfileAttributes, fetchPublicProfileKeys, upsertProfileAttribute } from './lib/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>([]);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [attrRes, keysRes] = await Promise.all([
          token ? fetchProfileAttributes(token) : Promise.resolve({ attributes: [] }),
          fetchPublicProfileKeys(),
        ]);
        setAttributes(attrRes.attributes.map(a => ({ key: a.key, value: a.value })));
        setAllKeys(keysRes.keys);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível carregar os atributos do perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const suggestedKeys = useMemo(() => {
    const existing = new Set(attributes.map(a => a.key.toLowerCase()));
    return allKeys.filter(k => !existing.has(k.toLowerCase()));
  }, [allKeys, attributes]);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      Alert.alert('Erro', 'Preencha a chave e o valor');
      return;
    }
    if (!token) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }
    try {
      setSaving(true);
      await upsertProfileAttribute(token, newKey.trim(), newValue.trim());
      // Atualizar localmente
      setAttributes(prev => {
        const others = prev.filter(a => a.key.toLowerCase() !== newKey.trim().toLowerCase());
        return [{ key: newKey.trim(), value: newValue.trim() }, ...others];
      });
      if (!allKeys.includes(newKey.trim())) {
        setAllKeys(prev => [...prev, newKey.trim()]);
      }
      setNewKey('');
      setNewValue('');
      Alert.alert('Sucesso', 'Atributo guardado');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao guardar atributo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (key: string) => {
    if (!token) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }
    try {
      setSaving(true);
      await deleteProfileAttribute(token, key);
      setAttributes(prev => prev.filter(a => a.key !== key));
      Alert.alert('Sucesso', 'Atributo removido');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao remover atributo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={{ padding: 24 }}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Adicionar atributo</Text>
              <Text style={styles.label}>Chave</Text>
              <TextInput
                style={styles.input}
                value={newKey}
                onChangeText={setNewKey}
                placeholder="Ex.: Profissao, Clube, Cidade"
                autoCapitalize="none"
              />
              {suggestedKeys.length > 0 ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', marginBottom: 8 }}>Sugestões:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {suggestedKeys.slice(0, 6).map(k => (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setNewKey(k)}
                        style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}
                      >
                        <Text style={{ color: '#111827' }}>{k}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={styles.input}
                value={newValue}
                onChangeText={setNewValue}
                placeholder="Ex.: Estudante, Real Madrid, Luanda"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAdd} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'A guardar...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Seus atributos</Text>
              {attributes.length === 0 ? (
                <Text style={{ color: '#6B7280' }}>Ainda não adicionou atributos.</Text>
              ) : (
                attributes.map(attr => (
                  <View key={attr.key} style={styles.attrRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attrKey}>{attr.key}</Text>
                      <Text style={styles.attrValue}>{attr.value}</Text>
                    </View>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(attr.key)} disabled={saving}>
                      <Text style={styles.removeText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#1F2937' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 15, color: '#1F2937' },
  bottomButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  saveButton: { backgroundColor: '#06B6D4', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  saveText: { color: '#FFFFFF', fontWeight: '600' },
  attrRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  attrKey: { fontSize: 14, fontWeight: '600', color: '#111827' },
  attrValue: { fontSize: 13, color: '#374151' },
  removeButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  removeText: { color: '#DC2626', fontWeight: '600' },
});

