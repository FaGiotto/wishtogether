import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CategoryKey, ALL_CATEGORIES_KEY } from '../constants/categories';
import { Colors, Spacing, Radii } from '../constants/theme';

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
      <TouchableOpacity
        style={[styles.chip, isActive(ALL_CATEGORIES_KEY) && styles.chipActiveAll]}
        onPress={() => onSelect(ALL_CATEGORIES_KEY)}
        activeOpacity={0.75}
      >
        {isActive(ALL_CATEGORIES_KEY) && (
          <Ionicons name="apps" size={13} color="#fff" style={styles.chipIcon} />
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
            style={[
              styles.chip,
              active && { backgroundColor: cat.color, borderColor: cat.color },
            ]}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.75}
          >
            {active && (
              <Ionicons name={cat.icon as any} size={13} color="#fff" style={styles.chipIcon} />
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
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 36,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chipActiveAll: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipIcon: { marginRight: 5 },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
