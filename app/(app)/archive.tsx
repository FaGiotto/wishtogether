import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUser } from '../../lib/context/UserContext';
import { useWishes } from '../../lib/hooks/useWishes';
import WishCard from '../../components/WishCard';
import EmptyState from '../../components/EmptyState';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function ArchiveScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { wishes, loading, refresh, removeWish } = useWishes(user?.couple_id, 'all', true);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Archivio</Text>
        <Text style={styles.headerSubtitle}>{wishes.length} completati</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={wishes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WishCard
              wish={item}
              onPress={() => router.push(`/wish/${item.id}`)}
              onMarkUndone={async () => {
                removeWish(item.id);
                await supabase.from('wishes').update({ is_done: false, done_at: null }).eq('id', item.id);
              }}
              onDelete={async () => {
                removeWish(item.id);
                await supabase.from('wishes').delete().eq('id', item.id);
              }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            wishes.length === 0 && styles.emptyContainer,
          ]}
          ListEmptyComponent={<EmptyState isDone />}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  headerSubtitle: { ...Typography.caption, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: Spacing.xs, paddingBottom: 40 },
  emptyContainer: { flex: 1 },
});
