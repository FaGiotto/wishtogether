import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CategoryKey, ALL_CATEGORIES_KEY } from '../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface Props {
  selected: CategoryKey | typeof ALL_CATEGORIES_KEY;
  onSelect: (key: CategoryKey | typeof ALL_CATEGORIES_KEY) => void;
}

export default function CategoryTab({ selected, onSelect }: Props) {
  const isActive = (key: string) => selected === key;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Chip "Tutti" */}
      <TouchableOpacity
        style={[styles.chip, isActive(ALL_CATEGORIES_KEY) && styles.chipActiveAll]}
        onPress={() => onSelect(ALL_CATEGORIES_KEY)}
        activeOpacity={0.75}
      >
        {isActive(ALL_CATEGORIES_KEY) && (
          <Ionicons name="apps-outline" size={13} color={Colors.surface} style={styles.chipIcon} />
        )}
        <Text style={[styles.chipText, isActive(ALL_CATEGORIES_KEY) && styles.chipTextActive]}>
          Tutti
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((cat) => {
        const active = isActive(cat.key);
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.75}
          >
            {active && (
              <Ionicons name={cat.icon as any} size={13} color={Colors.surface} style={styles.chipIcon} />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F5',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 48,
    paddingHorizontal: 16,
  },
  chipActiveAll: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipIcon: { marginRight: 4 },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
});
