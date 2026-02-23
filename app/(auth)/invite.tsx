import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../lib/context/UserContext';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function InviteScreen() {
  const router = useRouter();
  const { user, refresh } = useUser();

  const [inviteCode, setInviteCode] = useState('');
  const [myCode, setMyCode] = useState(user?.invite_code ?? '');
  const [loading, setLoading] = useState(false);

  // Sincronizza myCode se il profilo cambia
  useEffect(() => {
    if (user?.invite_code) setMyCode(user.invite_code);
  }, [user?.invite_code]);

  // Genera un codice a 6 caratteri alfanumerici maiuscoli
  function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Salva invite_code su Supabase e va in Home
  async function handleCreateCode() {
    if (!user) return;
    setLoading(true);
    const code = generateCode();

    const { error } = await supabase
      .from('users')
      .update({ invite_code: code })
      .eq('id', user.id);

    if (error) {
      console.error('[handleCreateCode] Supabase error:', error);
      Alert.alert('Errore', error.message);
      setLoading(false);
      return;
    }

    setMyCode(code);
    await refresh();
    setLoading(false);
    router.replace('/(app)');
  }

  // Rigenera un nuovo codice senza navigare
  async function handleRegenerateCode() {
    if (!user) return;
    setLoading(true);
    const code = generateCode();

    const { error } = await supabase
      .from('users')
      .update({ invite_code: code })
      .eq('id', user.id);

    if (error) {
      console.error('[handleRegenerateCode] Supabase error:', error);
      Alert.alert('Errore', error.message);
    } else {
      setMyCode(code);
      await refresh();
    }
    setLoading(false);
  }

  // Cerca il partner per invite_code e collega i due account
  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase();
    if (!code || !user) return;
    setLoading(true);

    // maybeSingle() non genera errore se 0 righe trovate: restituisce data=null
    const { data: partner, error: queryError } = await supabase
      .from('users')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (queryError) {
      console.error('[handleJoin] Query error:', queryError);
      Alert.alert('Errore', `Impossibile cercare il codice: ${queryError.message}`);
      setLoading(false);
      return;
    }

    if (!partner) {
      console.log('[handleJoin] Nessun utente trovato con codice:', code);
      Alert.alert('Codice non trovato', 'Nessun utente trovato con questo codice. Controllalo e riprova.');
      setLoading(false);
      return;
    }

    if (partner.id === user.id) {
      Alert.alert('Errore', 'Non puoi unirti a te stesso.');
      setLoading(false);
      return;
    }

    const coupleId = [user.id, partner.id].sort().join('_');

    const { error: rpcError } = await supabase.rpc('link_couple', {
      p_user_id: user.id,
      p_partner_id: partner.id,
      p_couple_id: coupleId,
    });

    if (rpcError) {
      console.error('[handleJoin] link_couple RPC error:', rpcError);
      Alert.alert('Errore', rpcError.message);
      setLoading(false);
      return;
    }

    await refresh();
    setLoading(false);
    router.replace('/(app)');
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collega il partner</Text>
      <Text style={styles.subtitle}>
        Condividi il tuo codice oppure inserisci quello del partner.
        Puoi anche saltare questo passaggio e farlo dopo dalla Home.
      </Text>

      {/* Sezione: il mio codice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Il tuo codice invito</Text>

        {myCode ? (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{myCode}</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, styles.buttonOutline, { flex: 1, marginRight: Spacing.xs }]}
                onPress={handleRegenerateCode}
                disabled={loading}
              >
                <Text style={styles.buttonOutlineText}>Rigenera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { flex: 1, marginLeft: Spacing.xs }]}
                onPress={() => router.replace('/(app)')}
              >
                <Text style={styles.buttonText}>Vai alla Home →</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCreateCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Genera codice e vai alla Home</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* Sezione: unisciti con codice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unisciti con un codice</Text>
        <TextInput
          style={styles.input}
          placeholder="Codice a 6 caratteri"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, (loading || inviteCode.length < 6) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={loading || inviteCode.length < 6}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Unisciti e vai alla Home</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
  },
  title: { ...Typography.title, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
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
    marginBottom: Spacing.sm,
  },
  codeText: { fontSize: 32, fontWeight: '700', color: Colors.primary, letterSpacing: 0 },
  row: { flexDirection: 'row' },
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
    letterSpacing: 0,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: Colors.secondary },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  buttonOutlineText: { ...Typography.subtitle, color: Colors.primary },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { ...Typography.subtitle, color: Colors.surface },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
});
