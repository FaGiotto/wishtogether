import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../constants/categories';
import { Colors, Typography, Spacing } from '../constants/theme';

interface Props {
  category?: Category;
  isDone?: boolean;
}

const DEFAULT_MESSAGES = {
  title: 'Nessun desiderio',
  subtitle: 'Aggiungi il primo desiderio con il + in basso.',
};

const DONE_MESSAGES = {
  title: 'Niente nell\'archivio',
  subtitle: 'I desideri completati appariranno qui.',
};

export default function EmptyState({ category, isDone }: Props) {
  const messages = isDone ? DONE_MESSAGES : DEFAULT_MESSAGES;
  const subtitle = category
    ? `Aggiungi il primo "${category.label}" con il + in basso.`
    : messages.subtitle;

  return (
    <View style={styles.container}>
      <Ionicons
        name={(category?.icon as any) ?? 'heart-outline'}
        size={88}
        color={category?.color ?? Colors.border}
        style={styles.icon}
      />
      <Text style={styles.title}>{messages.title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  icon: { marginBottom: Spacing.lg, opacity: 0.65 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
