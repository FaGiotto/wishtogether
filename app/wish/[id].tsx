import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../lib/context/UserContext';
import { useComments } from '../../lib/hooks/useComments';
import CommentBubble from '../../components/CommentBubble';
import { Wish } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function WishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [wish, setWish] = useState<Wish | null>(null);
  const [loadingWish, setLoadingWish] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const { comments, loading: loadingComments, addComment } = useComments(id);
  const scrollRef = useRef<ScrollView>(null);
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function loadWish() {
      const { data } = await supabase
        .from('wishes')
        .select('*, creator:users!created_by(id, display_name)')
        .eq('id', id)
        .single();
      if (data) setWish(data as Wish);
      setLoadingWish(false);
    }
    loadWish();
  }, [id]);

  useEffect(() => {
    if (!loadingComments && comments.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [comments.length, loadingComments]);

  const category = CATEGORIES.find((c) => c.key === wish?.category);
  const hasImage = !!wish?.image_url;

  async function handleMarkDone() {
    if (!wish) return;
    Alert.alert('Segna come completato', 'Vuoi segnare questo desiderio come completato?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Segna fatto ✓',
        onPress: async () => {
          Animated.spring(checkScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 80,
          }).start(async () => {
            const { error } = await supabase
              .from('wishes')
              .update({ is_done: true, done_at: new Date().toISOString() })
              .eq('id', wish.id);
            if (error) {
              Alert.alert('Errore', error.message);
              checkScale.setValue(0);
            } else {
              router.back();
            }
          });
        },
      },
    ]);
  }

  async function handleDelete() {
    if (!wish) return;
    Alert.alert('Elimina desiderio', 'Questa azione è irreversibile.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('wishes').delete().eq('id', wish.id);
          if (error) Alert.alert('Errore', error.message);
          else router.back();
        },
      },
    ]);
  }

  function handleMenu() {
    const buttons: any[] = [];
    if (!wish?.is_done) {
      buttons.push({ text: 'Segna come completato ✓', onPress: handleMarkDone });
    }
    buttons.push({ text: 'Elimina desiderio', style: 'destructive', onPress: handleDelete });
    buttons.push({ text: 'Annulla', style: 'cancel' });
    Alert.alert(wish?.title ?? '', undefined, buttons);
  }

  function handleLongPressComment(commentId: string, isMe: boolean) {
    if (!isMe) return;
    Alert.alert('Elimina commento', 'Vuoi eliminare questo commento?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('comments').delete().eq('id', commentId);
        },
      },
    ]);
  }

  async function handleSendComment() {
    if (!commentText.trim() || !user) return;
    setSending(true);
    await addComment(commentText.trim(), user.id);
    setCommentText('');
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  if (loadingWish) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!wish) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={{ color: Colors.textSecondary }}>Desiderio non trovato.</Text>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(wish.created_at).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Header controls — colore dipende da se c'è l'immagine
  const iconColor = hasImage ? '#fff' : Colors.textPrimary;
  const headerContent = (
    <View style={[styles.headerRow, { paddingTop: hasImage ? insets.top + 8 : 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {hasImage ? (
          <View style={styles.iconCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        ) : (
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        )}
      </TouchableOpacity>

      {category ? (
        <View style={[
          styles.categoryPill,
          hasImage
            ? { backgroundColor: 'rgba(0,0,0,0.35)' }
            : { backgroundColor: category.color + '18' },
        ]}>
          <Ionicons name={category.icon as any} size={13} color={hasImage ? '#fff' : category.color} style={{ marginRight: 4 }} />
          <Text style={[styles.categoryLabel, { color: hasImage ? '#fff' : category.color }]}>{category.label}</Text>
        </View>
      ) : <View style={{ flex: 1 }} />}

      <TouchableOpacity onPress={handleMenu} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {hasImage ? (
          <View style={styles.iconCircle}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </View>
        ) : (
          <Ionicons name="ellipsis-horizontal" size={22} color={iconColor} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Hero image header ── */}
      {hasImage ? (
        <View style={styles.heroContainer}>
          <Image source={{ uri: wish.image_url! }} style={styles.heroImage} resizeMode="cover" />
          {/* Gradient overlay — scuro in alto, trasparente in basso */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {/* Header sovrapposto */}
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-start' }]}>
            {headerContent}
          </View>
        </View>
      ) : (
        <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.background }}>
          {headerContent}
        </SafeAreaView>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Wish info */}
          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{wish.title}</Text>
              {wish.is_done ? (
                <Animated.View style={[styles.doneCheck, { transform: [{ scale: checkScale }] }]}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                </Animated.View>
              ) : null}
            </View>
            {wish.description ? (
              <Text style={styles.description}>{wish.description}</Text>
            ) : null}
            <Text style={styles.meta}>
              Aggiunto da {wish.creator?.display_name ?? 'qualcuno'} · {formattedDate}
            </Text>
            {wish.source_url ? (
              <Text style={styles.sourceUrl} numberOfLines={1}>{wish.source_url}</Text>
            ) : null}
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Commenti</Text>
            {loadingComments ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
            ) : comments.length === 0 ? (
              <Text style={styles.emptyComments}>Nessun commento ancora. Sii il primo!</Text>
            ) : (
              comments.map((c) => (
                <CommentBubble
                  key={c.id}
                  comment={c}
                  isMe={c.user_id === user?.id}
                  onLongPress={() => handleLongPressComment(c.id, c.user_id === user?.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment input footer */}
        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            placeholder="Scrivi un commento..."
            placeholderTextColor={Colors.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },

  // Hero
  heroContainer: { width: '100%', aspectRatio: 16 / 9 },
  heroImage: { width: '100%', height: '100%' },

  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  iconBtn: { padding: 4 },
  iconCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radii.full,
  },
  categoryLabel: { fontSize: 12, fontWeight: '700' },

  // Content
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },
  infoSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  title: { ...Typography.title, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  doneCheck: { marginLeft: 4 },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs },
  sourceUrl: { fontSize: 12, color: Colors.primary, marginTop: 4 },
  commentsSection: {
    marginTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  commentsTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  emptyComments: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 28,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
