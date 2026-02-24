import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import PriorityHearts from './PriorityHearts';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';

interface Props {
  visible: boolean;
  wishTitle: string;
  onClose: () => void;
  onConfirm: (value: number) => Promise<void>;
}

const SHEET_HEIGHT = 300;

export default function PriorityVoteSheet({ visible, wishTitle, onClose, onConfirm }: Props) {
  const [value, setValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setValue(0);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  async function handleConfirm() {
    if (value === 0 || saving) return;
    setSaving(true);
    await onConfirm(value);
    setSaving(false);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleBar} />

        <Text style={styles.heading}>Quanto ci tieni?</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{wishTitle}</Text>

        <View style={styles.heartsRow}>
          <PriorityHearts value={value} interactive outlined onSelect={setValue} size={40} />
        </View>

        {value > 0 && (
          <View style={styles.warning}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.warningText}>Il voto non è modificabile una volta confermato</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, (value === 0 || saving) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={value === 0 || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            {saving ? 'Salvataggio...' : 'Conferma priorità'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayDark,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 36,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },
  handleBar: {
    width: 36, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
    maxWidth: Dimensions.get('window').width - 64,
  },
  heartsRow: {
    marginBottom: Spacing.md,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 15,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmBtnText: { ...Typography.subtitle, color: '#fff' },
});
