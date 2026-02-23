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
import EmptyState from '../../components/EmptyState';
import LinkPartnerSheet from '../../components/LinkPartnerSheet';
import GradientBackground from '../../components/GradientBackground';
import { CATEGORIES, CategoryKey, ALL_CATEGORIES_KEY } from '../../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | typeof ALL_CATEGORIES_KEY>(ALL_CATEGORIES_KEY);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { wishes, loading, refresh: refreshWishes, removeWish } = useWishes(user?.couple_id, selectedCategory, false);
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
      <GradientBackground style={styles.gradientFlex}>
        <SafeAreaView style={styles.containerTransparent} edges={['top']}>
          {header}
          <LinkPartnerSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />

          <View style={styles.gateContainer}>
            <View style={styles.gateCard}>
              {/* Icona */}
              <View style={styles.gateIconWrap}>
                <Ionicons name="people" size={48} color="#fff" />
                <View style={styles.gateHeartBadge}>
                  <Ionicons name="heart" size={16} color="#fff" />
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
                  <View key={cat.key} style={styles.gatePill}>
                    <Ionicons name={cat.icon as any} size={13} color={Colors.hearts} style={{ marginRight: 4 }} />
                    <Text style={styles.gatePillText}>{cat.label}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.gateButton}
                onPress={() => setSheetVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="link-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.gateButtonText}>Inizia a collegarti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
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
            <WishCard
              wish={item}
              onPress={() => router.push(`/wish/${item.id}`)}
              onMarkDone={async () => {
                removeWish(item.id);
                await supabase.from('wishes').update({ is_done: true, done_at: new Date().toISOString() }).eq('id', item.id);
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
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradientFlex: { flex: 1 },
  containerTransparent: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1.5, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  // Gate
  gateContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  gateCard: {
    backgroundColor: '#16151F',
    borderRadius: 28, padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  gateIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
  },
  gateHeartBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  gateTitle: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: Spacing.sm },
  gateSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  gatePills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: Spacing.xl },
  gatePill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: Radii.full, paddingVertical: 6, paddingHorizontal: 11, backgroundColor: 'rgba(255,255,255,0.06)' },
  gatePillText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  gateButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: Radii.button,
    paddingVertical: 17, paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  gateButtonText: { ...Typography.subtitle, color: '#fff' },
  // App
  tabBarWrapper: { backgroundColor: Colors.background, zIndex: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  emptyContainer: { flex: 1 },
  fabContainer: { position: 'absolute', bottom: 20, right: 20 },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});
