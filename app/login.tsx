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
} from 'react-native';

const LoginScreen = () => {

 const router = useRouter();
  
    
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login attempt:', { username, password });
    router.push('/home');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo de volta</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Username Input */}
          <TextInput
            style={styles.input}
            placeholder="Nome de utilizador"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password Input */}
          <TextInput
            style={styles.input}
            placeholder="Palavra-passe"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Iniciar Sessão</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity onPress={handleRegister} style={styles.registerLink}>
            <Text style={styles.registerLinkText}>
              Não tem uma conta? <Text style={styles.registerLinkBold}>Registar-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Indicator */}
      <View style={styles.bottomIndicator}>
        <View style={styles.indicator} />
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    //shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backIcon: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 15,
    color: '#06B6D4',
    textAlign: 'center'
  },
  registerLinkBold: {
    fontWeight: '600',
  },
  bottomIndicator: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  indicator: {
    width: 128,
    height: 4,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
  },
});

export default LoginScreen;