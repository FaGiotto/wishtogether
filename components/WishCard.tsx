import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useRef, useState } from 'react';
import PriorityHearts from './PriorityHearts';
import PriorityVoteSheet from './PriorityVoteSheet';
import { Wish } from '../types';
import { CATEGORIES } from '../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { useUser } from '../lib/context/UserContext';
import { supabase } from '../lib/supabase';

interface Props {
  wish: Wish;
  onPress: () => void;
  onMarkDone?: () => void;
  onMarkUndone?: () => void;
  onDelete?: () => void;
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

export default function WishCard({ wish, onPress, onMarkDone, onMarkUndone, onDelete }: Props) {
  const { user } = useUser();
  const category = CATEGORIES.find((c) => c.key === wish.category);
  const hasImage = !!wish.image_url;

  const priorities = wish.wish_priorities ?? [];
  const myVote    = priorities.find((p) => p.user_id === user?.id);
  const theirVote = priorities.find((p) => p.user_id !== user?.id);

  const [localMyValue, setLocalMyValue] = useState<number | null>(null);
  const effectiveMyVote = localMyValue !== null
    ? { value: localMyValue, user_id: user?.id ?? '' }
    : myVote;
  const effectiveBothVoted = !!effectiveMyVote && !!theirVote;
  const effectiveAvg = effectiveBothVoted
    ? (effectiveMyVote!.value + theirVote!.value) / 2
    : null;
  const effectiveAvgLabel = effectiveAvg !== null
    ? (Number.isInteger(effectiveAvg) ? String(effectiveAvg) : effectiveAvg.toFixed(1))
    : null;

  const showVoteWarning = !wish.is_done && !effectiveMyVote;

  const [voteSheetVisible, setVoteSheetVisible] = useState(false);

  async function handleVoteConfirm(value: number) {
    if (!user) return;
    await supabase.from('wish_priorities').insert({
      wish_id: wish.id,
      user_id: user.id,
      value,
    });
    setLocalMyValue(value);
  }

  const swipeRef = useRef<Swipeable>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  function close() {
    swipeRef.current?.close();
  }

  function slideOut(direction: 'left' | 'right', then: () => void) {
    Animated.timing(slideAnim, {
      toValue: direction === 'left' ? -500 : 500,
      duration: 260,
      useNativeDriver: true,
    }).start(() => then());
  }

  function handleSwipeRight() {
    if (onMarkDone) {
      Alert.alert('Segna come completato', `Vuoi segnare "${wish.title}" come completato?`, [
        { text: 'Annulla', style: 'cancel', onPress: close },
        { text: 'Segna fatto ✓', onPress: () => slideOut('right', onMarkDone) },
      ]);
    } else if (onMarkUndone) {
      Alert.alert('Riporta nella lista', `Vuoi rimettere "${wish.title}" tra i desideri?`, [
        { text: 'Annulla', style: 'cancel', onPress: close },
        { text: 'Riporta nella lista', onPress: () => slideOut('right', onMarkUndone) },
      ]);
    }
  }

  function handleSwipeLeft() {
    if (!onDelete) return;
    Alert.alert('Elimina desiderio', `Vuoi eliminare "${wish.title}"?`, [
      { text: 'Annulla', style: 'cancel', onPress: close },
      { text: 'Elimina', style: 'destructive', onPress: () => slideOut('left', onDelete) },
    ]);
  }

  const renderLeftAction = (progress: Animated.AnimatedInterpolation<number>) => {
    const opacity = progress.interpolate({ inputRange: [0.15, 0.5], outputRange: [0, 1], extrapolate: 'clamp' });
    const scale = progress.interpolate({ inputRange: [0.15, 0.5], outputRange: [0.5, 1], extrapolate: 'clamp' });
    return (
      <View style={styles.actionLeft}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={26} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  const renderRightAction = (progress: Animated.AnimatedInterpolation<number>) => {
    const opacity = progress.interpolate({ inputRange: [0.15, 0.5], outputRange: [0, 1], extrapolate: 'clamp' });
    const scale = progress.interpolate({ inputRange: [0.15, 0.5], outputRange: [0.5, 1], extrapolate: 'clamp' });
    const bgColor = onMarkDone ? Colors.success : Colors.primary;
    const iconName = onMarkDone ? 'checkmark' : 'arrow-undo-outline';
    return (
      <View style={[styles.actionRight, { backgroundColor: bgColor }]}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Ionicons name={iconName as any} size={28} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  // Colori adattativi: bianchi sopra immagine, normali senza
  const titleColor  = hasImage ? '#fff' : Colors.textPrimary;
  const metaColor   = hasImage ? Colors.glassTextMid : Colors.textSecondary;
  const pillBg      = hasImage ? Colors.glassBgStrong : Colors.primary + '18';
  const pillColor   = hasImage ? '#fff' : Colors.primary;

  const cardInner = (
    <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, hasImage && styles.cardWithImage, wish.is_done && styles.cardDone]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Sfondo immagine */}
        {hasImage && (
          <Image
            source={{ uri: wish.image_url! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        {/* Gradient overlay */}
        {hasImage && (
          <LinearGradient
            colors={['transparent', Colors.overlayImageMid, Colors.overlayImageDeep]}
            locations={[0.2, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Contenuto — in fondo se c'è immagine */}
        <View style={[styles.content, hasImage && styles.contentWithImage]}>
          <View style={styles.body}>
            <View style={styles.row}>
              {category && (
                <View style={[styles.categoryPill, { backgroundColor: pillBg }]}>
                  <Ionicons name={category.icon as any} size={11} color={pillColor} style={{ marginRight: 3 }} />
                  <Text style={[styles.categoryText, { color: pillColor }]}>{category.label}</Text>
                </View>
              )}
              <View style={styles.rowRight}>
                {wish.is_done && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                )}
              </View>
            </View>

            <Text style={[styles.title, { color: titleColor }, wish.is_done && styles.titleDone]} numberOfLines={2}>
              {wish.title}
            </Text>
          </View>

          {(() => {
            const commentCount = wish.comments?.[0]?.count ?? 0;
            const commentEl = commentCount > 0 ? (
              <View style={styles.commentBadge}>
                <Ionicons name="chatbubble-outline" size={12} color={metaColor} />
                <Text style={[styles.commentCount, { color: metaColor }]}>{commentCount}</Text>
              </View>
            ) : null;

            if (effectiveBothVoted && effectiveAvgLabel !== null) {
              return (
                <View style={[styles.avgBanner, hasImage && styles.avgBannerOnImage]}>
                  <PriorityHearts
                    value={Math.round(effectiveAvg!)}
                    size={16}
                    filledColor={hasImage ? Colors.hearts : Colors.heartsDark}
                    emptyColor={hasImage ? Colors.hearts + '70' : Colors.inputEmpty}
                  />
                  <Text style={[styles.avgBannerValue, hasImage && { color: '#fff' }]}>{effectiveAvgLabel}</Text>
                  {commentEl && <View style={styles.commentRight}>{commentEl}</View>}
                </View>
              );
            }

            if (!effectiveBothVoted && effectiveMyVote && !theirVote) {
              return (
                <View style={[styles.waitingBanner, hasImage && styles.waitingBannerOnImage]}>
                  <Ionicons name="time-outline" size={13} color={hasImage ? Colors.glassTextLight : Colors.textSecondary} />
                  <Text style={[styles.waitingBannerText, hasImage && { color: Colors.glassTextLight }]}>
                    Partner non ha ancora votato
                  </Text>
                  {commentEl && <View style={styles.commentRight}>{commentEl}</View>}
                </View>
              );
            }

            if (showVoteWarning) {
              return (
                <TouchableOpacity
                  style={[styles.voteBanner, hasImage && styles.voteBannerOnImage]}
                  onPress={() => setVoteSheetVisible(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="heart-outline" size={13} color={hasImage ? Colors.voteBannerHighlight : Colors.voteBannerText} />
                  <Text style={[styles.voteBannerText, hasImage && { color: Colors.voteBannerHighlight }]}>Dai la tua priorità</Text>
                  <View style={styles.commentRight}>
                    {commentEl}
                    <Ionicons name="chevron-forward" size={13} color={hasImage ? Colors.voteBannerHighlight : Colors.voteBannerText} />
                  </View>
                </TouchableOpacity>
              );
            }

            return commentEl ? (
              <View style={[styles.waitingBanner, hasImage && styles.waitingBannerOnImage, { justifyContent: 'flex-end' }]}>
                {commentEl}
              </View>
            ) : null;
          })()}
        </View>

        <PriorityVoteSheet
          visible={voteSheetVisible}
          wishTitle={wish.title}
          onClose={() => setVoteSheetVisible(false)}
          onConfirm={handleVoteConfirm}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  if (!onMarkDone && !onMarkUndone && !onDelete) {
    return <View style={styles.shadow}>{cardInner}</View>;
  }

  return (
    <View style={styles.shadow}>
      <Swipeable
        ref={swipeRef}
        renderLeftActions={onDelete ? renderLeftAction : undefined}
        renderRightActions={(onMarkDone || onMarkUndone) ? renderRightAction : undefined}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') handleSwipeLeft();
          else handleSwipeRight();
        }}
        leftThreshold={72}
        rightThreshold={72}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
      >
        {cardInner}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radii.card,
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowCard,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  card: {
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardWithImage: {
    aspectRatio: 4 / 3,
    borderWidth: 0,
  },
  cardDone: { opacity: 0.55 },

  // Layout content
  content: { },
  contentWithImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  body: { padding: Spacing.md, paddingTop: 18, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryText: { fontSize: 11, fontWeight: '700' },
  rowRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 6, lineHeight: 34 },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentCount: { fontSize: 12 },
  commentRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Banners — versione normale
  avgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
  },
  avgBannerOnImage: { paddingBottom: 12 },
  avgBannerLabel: { fontSize: 12, fontWeight: '600', color: Colors.hearts, marginLeft: 2 },
  avgBannerValue: { fontSize: 14, fontWeight: '800', color: Colors.heartsDark },

  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  waitingBannerOnImage: {
    backgroundColor: Colors.overlayMedium,
    borderTopColor: Colors.glassBorderMid,
  },
  waitingBannerText: { fontSize: 12, color: Colors.textSecondary },

  voteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.voteBannerBg,
    borderTopWidth: 1,
    borderTopColor: Colors.voteBannerBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  voteBannerOnImage: {
    backgroundColor: Colors.overlayMedium,
    borderTopColor: Colors.glassBorderMid,
  },
  voteBannerText: { fontSize: 12, fontWeight: '600', color: Colors.voteBannerText },

  actionLeft: {
    flex: 1,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 28,
    borderRadius: Radii.card,
  },
  actionRight: {
    flex: 1,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 28,
    borderRadius: Radii.card,
  },

  // unused legacy
  doneIcon: { marginLeft: 'auto' },
  meta: { ...Typography.caption },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
