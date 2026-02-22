import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function InviteScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from('users')
      .select('invite_code')
      .eq('id', user.id)
      .single();

    if (data?.invite_code) {
      setMyCode(data.invite_code);
    }
    setFetching(false);
  }

  async function handleCreateCouple() {
    if (!userId) return;
    setLoading(true);
    // Genera un codice unico a 6 caratteri
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase
      .from('users')
      .update({ invite_code: code })
      .eq('id', userId);
    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      setMyCode(code);
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!inviteCode.trim() || !userId) return;
    setLoading(true);

    const { data: partner, error } = await supabase
      .from('users')
      .select('id, couple_id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error || !partner) {
      Alert.alert('Codice non valido', 'Nessun utente trovato con questo codice.');
      setLoading(false);
      return;
    }

    if (partner.id === userId) {
      Alert.alert('Errore', 'Non puoi unirti a te stesso.');
      setLoading(false);
      return;
    }

    // Crea un couple_id condiviso (usiamo l'id del partner come base)
    const coupleId = [userId, partner.id].sort().join('_');

    const { error: updateError } = await supabase.rpc('link_couple', {
      p_user_id: userId,
      p_partner_id: partner.id,
      p_couple_id: coupleId,
    });

    setLoading(false);
    if (updateError) {
      Alert.alert('Errore', updateError.message);
    }
  }

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collega il partner</Text>
      <Text style={styles.subtitle}>Condividi il tuo codice o inserisci quello del partner per creare la lista coppia.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Il tuo codice invito</Text>
        {myCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{myCode}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateCouple} disabled={loading}>
            <Text style={styles.buttonText}>Genera codice</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unisciti con un codice</Text>
        <TextInput
          style={styles.input}
          placeholder="Codice a 6 caratteri"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
          maxLength={6}
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleJoin}
          disabled={loading || inviteCode.length < 6}
        >
          <Text style={styles.buttonText}>{loading ? 'Collegamento...' : 'Unisciti'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg, paddingTop: 80 },
  title: { ...Typography.title, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.subtitle, color: Colors.textPrimary, marginBottom: Spacing.sm },
  codeBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 32, fontWeight: '700', color: Colors.primary, letterSpacing: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
    ...Typography.body,
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: Colors.secondary },
  buttonText: { ...Typography.subtitle, color: Colors.surface },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
});
