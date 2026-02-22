import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Wish } from '../types';
import { CATEGORIES } from '../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface Props {
  wish: Wish;
  onPress: () => void;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1}m fa`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h fa`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function WishCard({ wish, onPress }: Props) {
  const category = CATEGORIES.find((c) => c.key === wish.category);

  return (
    <TouchableOpacity
      style={[styles.card, wish.is_done && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {wish.image_url ? (
        <Image source={{ uri: wish.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        <View style={styles.row}>
          {category && (
            <View style={[styles.categoryPill, { backgroundColor: category.color + '18' }]}>
              <Ionicons name={category.icon as any} size={11} color={category.color} style={{ marginRight: 3 }} />
              <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
            </View>
          )}
          {wish.is_done && (
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} style={styles.doneIcon} />
          )}
        </View>

        <Text style={[styles.title, wish.is_done && styles.titleDone]} numberOfLines={2}>
          {wish.title}
        </Text>

        <Text style={styles.meta}>
          {wish.creator?.display_name ?? 'Tu'} · {relativeDate(wish.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardDone: { opacity: 0.55 },
  image: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: Spacing.md, paddingVertical: 18 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryText: { fontSize: 11, fontWeight: '700' },
  doneIcon: { marginLeft: 'auto' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, lineHeight: 23 },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  meta: { ...Typography.caption },
});
