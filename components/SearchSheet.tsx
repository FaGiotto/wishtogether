import {
  Modal, View, Text, TextInput, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../lib/search/tmdb';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  searchFn: (query: string) => Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
}

export default function SearchSheet({ visible, onClose, searchFn, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchFn(query.trim());
      setResults(res);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(result: SearchResult) {
    onSelect(result);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cerca</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder ?? 'Cerca...'}
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)} activeOpacity={0.75}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Ionicons name="image-outline" size={20} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.trim() && !loading ? (
                <Text style={styles.emptyText}>Nessun risultato per "{query}"</Text>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.subtitle, color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.button,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1, fontSize: 15, color: Colors.textPrimary,
    paddingVertical: 12,
  },
  loader: { marginTop: Spacing.xl },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  thumbnail: { width: 44, height: 44, borderRadius: 8 },
  thumbnailPlaceholder: {
    backgroundColor: Colors.surface2,
    justifyContent: 'center', alignItems: 'center',
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  resultSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: Spacing.xl, paddingHorizontal: Spacing.md },
});
