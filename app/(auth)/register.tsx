import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import FloatingLabelInput from '../../components/FloatingLabelInput';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Errore', 'Compila tutti i campi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) Alert.alert('Errore di registrazione', error.message);
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart" size={30} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>Crea account</Text>
            <Text style={styles.tagline}>inizia a condividere i tuoi desideri</Text>
          </View>

          <View style={styles.form}>
            <FloatingLabelInput
              label="Il tuo nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              dark
            />
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              dark
            />
            <FloatingLabelInput
              label="Password (min. 6 caratteri)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              dark
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Registrati</Text>}
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>
                Hai già un account?{'  '}
                <Text style={styles.linkBold}>Accedi</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cardDark },
  flex: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 30,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#fff',
    marginBottom: 6,
  },
  tagline: { ...Typography.body, color: Colors.glassTextSub },
  form: { marginBottom: Spacing.lg },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonText: { ...Typography.subtitle, color: '#fff' },
  linkButton: { alignItems: 'center', marginTop: Spacing.md },
  linkText: { ...Typography.body, color: Colors.glassTextLight },
  linkBold: { color: Colors.blobPrimary, fontWeight: '600' },
});
