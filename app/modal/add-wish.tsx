import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../lib/context/UserContext';
import { CATEGORIES, CategoryKey } from '../../constants/categories';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function AddWishModal() {
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Consenti l\'accesso alla galleria nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string, wishId: string): Promise<string | null> {
    try {
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `wishes/${wishId}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('wish-images').upload(path, blob, {
        contentType: `image/${ext}`,
        upsert: true,
      });
      if (error) return null;
      const { data } = supabase.storage.from('wish-images').getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Titolo obbligatorio', 'Inserisci un titolo per il desiderio.');
      return;
    }
    if (!category) {
      Alert.alert('Categoria obbligatoria', 'Seleziona una categoria.');
      return;
    }
    if (!user?.couple_id) {
      Alert.alert(
        'Partner non collegato',
        'Devi prima collegare il tuo partner per aggiungere desideri condivisi.',
      );
      return;
    }

    setSaving(true);

    // Insert preliminare per avere l'id
    const { data: inserted, error } = await supabase
      .from('wishes')
      .insert({
        couple_id: user.couple_id,
        category,
        title: title.trim(),
        description: notes.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      Alert.alert('Errore', error?.message ?? 'Impossibile salvare.');
      setSaving(false);
      return;
    }

    // Upload immagine se presente
    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadImage(imageUri, inserted.id);
      if (imageUrl) {
        await supabase.from('wishes').update({ image_url: imageUrl }).eq('id', inserted.id);
      }
    }

    setSaving(false);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Handle bar */}
      <View style={styles.handleBar} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nuovo desiderio</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Categoria */}
        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryPill, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon as any} size={16} color={active ? Colors.surface : cat.color} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Titolo */}
        <Text style={styles.label}>Titolo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Cena da Niko Romito"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Note */}
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Descrizione, link, suggerimenti..."
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Immagine */}
        <Text style={styles.label}>Immagine</Text>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImage} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Ionicons name="image-outline" size={28} color={Colors.textSecondary} />
            <Text style={styles.imagePickerText}>Scegli dalla galleria</Text>
          </TouchableOpacity>
        )}

        {/* Salva */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>Salva desiderio</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  categoryPillText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  categoryPillTextActive: { color: Colors.surface, fontWeight: '600' },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.textPrimary,
    letterSpacing: 0,
    fontFamily: 'System',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 13 },
  imagePicker: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.card,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  imagePickerText: { ...Typography.body, color: Colors.textSecondary },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radii.card },
  removeImage: { position: 'absolute', top: 8, right: 8 },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { ...Typography.subtitle, color: Colors.surface },
});
