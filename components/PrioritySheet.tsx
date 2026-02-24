import {
  View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import PriorityHearts from './PriorityHearts';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';

interface PriorityEntry {
  user_id: string;
  value: number;
  user: { display_name: string };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  myEntry?: PriorityEntry;
  partnerEntry?: PriorityEntry;
  average: number | null;
  onVoteConfirm: (value: number) => Promise<void>;
}

export default function PrioritySheet({ visible, onClose, myEntry, partnerEntry, average, onVoteConfirm }: Props) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [tempValue, setTempValue] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempValue(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 100,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  async function handleConfirm() {
    if (tempValue === 0) return;
    setSaving(true);
    await onVoteConfirm(tempValue);
    setSaving(false);
    onClose();
  }

  const avgLabel = average !== null
    ? (Number.isInteger(average) ? String(average) : average.toFixed(1))
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Priorità</Text>

        {/* Riga utente corrente */}
        <View style={styles.row}>
          <Text style={styles.name}>Tu</Text>
          <View style={styles.voteRight}>
            {myEntry ? (
              <>
                <PriorityHearts value={myEntry.value} size={22} filledColor={Colors.heartsDark} emptyColor={Colors.inputEmpty} />
                <Text style={styles.voteValue}>{myEntry.value}</Text>
              </>
            ) : (
              <PriorityHearts
                value={tempValue}
                interactive
                onSelect={setTempValue}
                size={26}
                filledColor={Colors.heartsDark}
                emptyColor={Colors.inputEmpty}
              />
            )}
          </View>
        </View>

        {/* Riga partner */}
        <View style={styles.row}>
          <Text style={styles.name}>{partnerEntry?.user.display_name ?? 'Partner'}</Text>
          <View style={styles.voteRight}>
            {partnerEntry ? (
              <>
                <PriorityHearts value={partnerEntry.value} size={22} filledColor={Colors.heartsDark} emptyColor={Colors.inputEmpty} />
                <Text style={styles.voteValue}>{partnerEntry.value}</Text>
              </>
            ) : (
              <Text style={styles.pending}>non ha ancora votato</Text>
            )}
          </View>
        </View>

        {/* Media — solo se entrambi hanno votato */}
        {avgLabel !== null && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.avgLabel}>Media</Text>
              <View style={styles.avgRight}>
                <PriorityHearts value={Math.round(average!)} size={22} filledColor={Colors.heartsDark} emptyColor={Colors.inputEmpty} />
                <Text style={styles.avgValue}>{avgLabel}</Text>
              </View>
            </View>
          </>
        )}

        {/* Zona voto — solo se utente non ha ancora votato */}
        {!myEntry && (
          <View style={styles.voteFooter}>
            {tempValue > 0 && (
              <View style={styles.warningRow}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.warningText}>Il voto non è modificabile una volta salvato</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, (tempValue === 0 || saving) && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={tempValue === 0 || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.confirmBtnText}>Conferma</Text>
              }
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  voteRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteValue: { fontSize: 15, fontWeight: '700', color: Colors.heartsDark, width: 28, textAlign: 'right' },
  pending: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  avgLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  avgRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avgValue: { fontSize: 16, fontWeight: '800', color: Colors.heartsDark, width: 28, textAlign: 'right' },
  voteFooter: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { ...Typography.subtitle, color: '#fff' },
});
