import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Wish } from '../types';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface Props {
  wish: Wish | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function WishActionSheet({ wish, onClose, onRefresh }: Props) {
  if (!wish) return null;

  function handleMarkDone() {
    Alert.alert(
      'Segna come completato',
      `Vuoi segnare "${wish!.title}" come fatto?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Sì, fatto! ✓',
          onPress: async () => {
            const { error } = await supabase
              .from('wishes')
              .update({ is_done: true, done_at: new Date().toISOString() })
              .eq('id', wish!.id);
            if (error) Alert.alert('Errore', error.message);
            else { onClose(); onRefresh(); }
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      'Elimina desiderio',
      `Vuoi eliminare "${wish!.title}"? L'azione è irreversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('wishes')
              .delete()
              .eq('id', wish!.id);
            if (error) Alert.alert('Errore', error.message);
            else { onClose(); onRefresh(); }
          },
        },
      ],
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      {/* Sheet */}
      <View style={styles.sheet}>
        <View style={styles.handleBar} />

        <Text style={styles.wishTitle} numberOfLines={2}>{wish.title}</Text>

        {/* Azione principale: segna come fatto */}
        {!wish.is_done && (
          <TouchableOpacity style={styles.doneButton} onPress={handleMarkDone} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.surface} style={styles.btnIcon} />
            <Text style={styles.doneButtonText}>Segna come completato</Text>
          </TouchableOpacity>
        )}

        {/* Azione secondaria: elimina */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} style={styles.btnIcon} />
          <Text style={styles.deleteButtonText}>Elimina desiderio</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  wishTitle: {
    ...Typography.subtitle,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: Radii.button,
    paddingVertical: 16,
    marginBottom: Spacing.sm,
  },
  doneButtonText: {
    ...Typography.subtitle,
    color: Colors.surface,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error + '50',
    borderRadius: Radii.button,
    paddingVertical: 13,
    marginTop: Spacing.xs,
  },
  deleteButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.error,
  },
  btnIcon: { marginRight: 8 },
});
