import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useUser } from '../../lib/context/UserContext';
import { useWishes } from '../../lib/hooks/useWishes';
import { supabase } from '../../lib/supabase';
import CategoryTab from '../../components/CategoryTab';
import WishCard from '../../components/WishCard';
import WishActionSheet from '../../components/WishActionSheet';
import EmptyState from '../../components/EmptyState';
import LinkPartnerSheet from '../../components/LinkPartnerSheet';
import { Wish } from '../../types';
import { CATEGORIES, CategoryKey, ALL_CATEGORIES_KEY } from '../../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | typeof ALL_CATEGORIES_KEY>(ALL_CATEGORIES_KEY);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const { wishes, loading, refresh: refreshWishes } = useWishes(user?.couple_id, selectedCategory, false);
  const activeCategory = CATEGORIES.find((c) => c.key === selectedCategory);

  useFocusEffect(
    useCallback(() => {
      refreshWishes();
    }, [refreshWishes]),
  );

  function handleAvatarPress() {
    const buttons: any[] = [];
    if (user?.couple_id) {
      buttons.push({
        text: 'Scollega partner',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Scollega partner',
            'Sei sicuro? Perderete entrambi accesso alla lista condivisa.',
            [
              { text: 'Annulla', style: 'cancel' },
              { text: 'Scollega', style: 'destructive', onPress: handleUnlink },
            ],
          ),
      });
    }
    buttons.push({ text: 'Log out', style: 'destructive', onPress: handleLogout });
    buttons.push({ text: 'Annulla', style: 'cancel' });
    Alert.alert(user?.display_name ?? 'Profilo', user?.email ?? '', buttons);
  }

  async function handleUnlink() {
    const { error } = await supabase.rpc('unlink_couple', { p_user_id: user!.id });
    if (error) {
      console.error('[handleUnlink]', error);
      Alert.alert('Errore', error.message);
    } else {
      await refresh();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ─── Header comune a entrambi gli scenari ────────────────────────────────
  const header = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>WishTogether</Text>
      {user?.display_name ? (
        <TouchableOpacity
          style={styles.avatar}
          onPress={handleAvatarPress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.avatarText}>{user.display_name[0].toUpperCase()}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // ─── Scenario A: utente non collegato ────────────────────────────────────
  if (!user?.couple_id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <LinkPartnerSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />

        <View style={styles.gateContainer}>
          <View style={styles.gateCard}>
            {/* Icona */}
            <View style={styles.gateIconWrap}>
              <Ionicons name="people" size={48} color={Colors.primary} />
              <View style={styles.gateHeartBadge}>
                <Ionicons name="heart" size={16} color={Colors.surface} />
              </View>
            </View>

            {/* Testi */}
            <Text style={styles.gateTitle}>Collega il tuo partner</Text>
            <Text style={styles.gateSubtitle}>
              Condividi un codice con il tuo partner per creare la vostra lista di desideri condivisa.
            </Text>

            {/* Categoria pills decorative */}
            <View style={styles.gatePills}>
              {CATEGORIES.map((cat) => (
                <View key={cat.key} style={[styles.gatePill, { backgroundColor: cat.color + '18', borderColor: cat.color + '40' }]}>
                  <Ionicons name={cat.icon as any} size={13} color={cat.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.gatePillText, { color: cat.color }]}>{cat.label}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.gateButton}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="link-outline" size={20} color={Colors.surface} style={{ marginRight: 8 }} />
              <Text style={styles.gateButtonText}>Inizia a collegarti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Scenario B: utente collegato → app completa ─────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}

      {/* CategoryTab sticky sopra la lista */}
      <View style={styles.tabBarWrapper}>
        <CategoryTab selected={selectedCategory} onSelect={setSelectedCategory} />
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
            <WishCard wish={item} onPress={() => setSelectedWish(item)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            wishes.length === 0 && styles.emptyContainer,
          ]}
          ListEmptyComponent={<EmptyState category={activeCategory} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/modal/add-wish')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <WishActionSheet
        wish={selectedWish}
        onClose={() => setSelectedWish(null)}
        onRefresh={refreshWishes}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: 15 },

  // Gate (scenario non collegato)
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  gateCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  gateHeartBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  gateSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  gatePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  gatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  gatePillText: { fontSize: 12, fontWeight: '600' },
  gateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  gateButtonText: { ...Typography.subtitle, color: Colors.surface },

  // App collegata
  tabBarWrapper: {
    backgroundColor: Colors.background,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: Spacing.xs, paddingBottom: Spacing.xl },
  emptyContainer: { flex: 1 },
  fabContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
