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
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handleBar} />
        <Text style={styles.wishTitle} numberOfLines={2}>{wish.title}</Text>

        {!wish.is_done && (
          <TouchableOpacity style={styles.doneButton} onPress={handleMarkDone} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={styles.doneButtonText}>Segna come completato</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={17} color={Colors.error} style={styles.btnIcon} />
          <Text style={styles.deleteButtonText}>Elimina desiderio</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlayActionSheet,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.md,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 16,
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
  doneButtonText: { ...Typography.subtitle, color: '#fff' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error + '40',
    borderRadius: Radii.button,
    paddingVertical: 14,
    marginTop: Spacing.xs,
  },
  deleteButtonText: { ...Typography.body, fontWeight: '600', color: Colors.error },
  btnIcon: { marginRight: 8 },
});
