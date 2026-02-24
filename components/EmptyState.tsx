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
  title: "Niente nell'archivio",
  subtitle: 'I desideri completati appariranno qui.',
};

export default function EmptyState({ category, isDone }: Props) {
  const messages = isDone ? DONE_MESSAGES : DEFAULT_MESSAGES;
  const subtitle = category
    ? `Aggiungi il primo "${category.label}" con il + in basso.`
    : messages.subtitle;
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={(category?.icon as any) ?? 'heart-outline'}
          size={44}
          color={Colors.primary}
        />
      </View>
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
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
