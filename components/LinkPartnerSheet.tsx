import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/context/UserContext';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function LinkPartnerSheet({ visible, onClose }: Props) {
  const { user, refresh } = useUser();
  const [myCode, setMyCode] = useState(user?.invite_code ?? '');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.invite_code) setMyCode(user.invite_code);
  }, [user?.invite_code]);

  async function handleGenerateCode() {
    if (!user) return;
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase.from('users').update({ invite_code: code }).eq('id', user.id);
    if (error) { Alert.alert('Errore', error.message); }
    else { setMyCode(code); await refresh(); }
    setLoading(false);
  }

  async function handleRegenerateCode() {
    if (!user) return;
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase.from('users').update({ invite_code: code }).eq('id', user.id);
    if (error) { Alert.alert('Errore', error.message); }
    else { setMyCode(code); await refresh(); }
    setLoading(false);
  }

  async function handleJoin() {
    const code = inputCode.trim().toUpperCase();
    if (!code || !user) return;
    setLoading(true);

    const { data: partner, error: queryError } = await supabase
      .from('users').select('id').eq('invite_code', code).maybeSingle();

    if (queryError) { Alert.alert('Errore', queryError.message); setLoading(false); return; }
    if (!partner) { Alert.alert('Codice non trovato', 'Nessun utente trovato con questo codice.'); setLoading(false); return; }
    if (partner.id === user.id) { Alert.alert('Errore', 'Non puoi collegarti a te stesso.'); setLoading(false); return; }

    const coupleId = [user.id, partner.id].sort().join('_');
    const { error: rpcError } = await supabase.rpc('link_couple', {
      p_user_id: user.id, p_partner_id: partner.id, p_couple_id: coupleId,
    });

    if (rpcError) { Alert.alert('Errore', rpcError.message); setLoading(false); return; }

    await refresh();
    setLoading(false);
    Alert.alert('Coppia collegata! 💜', 'Ora condividete la stessa lista di desideri.', [
      { text: 'Iniziamo', onPress: onClose },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.handleBar} />
        <View style={styles.header}>
          <Text style={styles.title}>Collega il partner</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Il tuo codice invito</Text>
          <Text style={styles.sectionSubtitle}>Condividilo con il partner così può inserirlo qui sotto.</Text>
          {myCode ? (
            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{myCode}</Text>
              </View>
              <TouchableOpacity style={styles.regenButton} onPress={handleRegenerateCode} disabled={loading}>
                <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                <Text style={styles.regenText}>Rigenera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleGenerateCode} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Genera il mio codice</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oppure</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inserisci il codice del partner</Text>
          <TextInput
            style={styles.input}
            placeholder="_ _ _ _ _ _"
            placeholderTextColor={Colors.border}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            value={inputCode}
            onChangeText={setInputCode}
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, (inputCode.length < 6 || loading) && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={inputCode.length < 6 || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Collega</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg },
  handleBar: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xs,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  title: { ...Typography.title, color: Colors.textPrimary },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.subtitle, color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { ...Typography.caption, marginBottom: Spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  codeBox: {
    flex: 1, backgroundColor: Colors.surface2,
    borderRadius: Radii.card, paddingVertical: Spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  codeText: { fontSize: 28, fontWeight: '700', color: Colors.primary, letterSpacing: 8 },
  regenButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  regenText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: Spacing.sm,
    ...Typography.subtitle,
    color: Colors.textPrimary, letterSpacing: 8, textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radii.button,
    paddingVertical: 17, alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: Colors.secondary },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...Typography.subtitle, color: '#fff' },
});
