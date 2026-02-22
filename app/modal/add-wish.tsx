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
    if (status !== 'granted') { Alert.alert('Permesso negato', "Consenti l'accesso alla galleria."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function uploadImage(uri: string, wishId: string): Promise<string | null> {
    try {
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `wishes/${wishId}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('wish-images').upload(path, blob, { contentType: `image/${ext}`, upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from('wish-images').getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Titolo obbligatorio', 'Inserisci un titolo per il desiderio.'); return; }
    if (!category) { Alert.alert('Categoria obbligatoria', 'Seleziona una categoria.'); return; }
    if (!user?.couple_id) { Alert.alert('Partner non collegato', 'Devi prima collegare il tuo partner.'); return; }
    setSaving(true);
    const { data: inserted, error } = await supabase.from('wishes').insert({
      couple_id: user.couple_id, category, title: title.trim(),
      description: notes.trim() || null, created_by: user.id,
    }).select('id').single();
    if (error || !inserted) { Alert.alert('Errore', error?.message ?? 'Impossibile salvare.'); setSaving(false); return; }
    if (imageUri) {
      const imageUrl = await uploadImage(imageUri, inserted.id);
      if (imageUrl) await supabase.from('wishes').update({ image_url: imageUrl }).eq('id', inserted.id);
    }
    setSaving(false);
    router.back();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.handleBar} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nuovo desiderio</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryPill, active && { backgroundColor: cat.color + '18', borderColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon as any} size={15} color={active ? cat.color : Colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryPillText, active && { color: cat.color, fontWeight: '700' }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Titolo *</Text>
        <TextInput
          style={styles.input} placeholder="Es. Cena da Niko Romito"
          placeholderTextColor={Colors.textSecondary} value={title} onChangeText={setTitle} maxLength={100}
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]} placeholder="Descrizione, link, suggerimenti..."
          placeholderTextColor={Colors.textSecondary} value={notes} onChangeText={setNotes}
          multiline numberOfLines={3}
        />

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
            <Ionicons name="image-outline" size={26} color={Colors.textSecondary} />
            <Text style={styles.imagePickerText}>Scegli dalla galleria</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salva desiderio</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  handleBar: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xs },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, paddingTop: Spacing.sm },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs, marginTop: Spacing.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.full, paddingVertical: 8, paddingHorizontal: 14,
  },
  categoryPillText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.button, paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 15, fontWeight: '400', color: Colors.textPrimary,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },
  imagePicker: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radii.card, paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
  },
  imagePickerText: { ...Typography.body, color: Colors.textSecondary },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radii.card },
  removeImage: { position: 'absolute', top: 8, right: 8 },
  saveButton: {
    backgroundColor: Colors.primary, borderRadius: Radii.button,
    paddingVertical: 17, alignItems: 'center', marginTop: Spacing.xl,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { ...Typography.subtitle, color: '#fff' },
});
