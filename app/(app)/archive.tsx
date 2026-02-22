import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function ArchiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Archivio — desideri completati (Fase 2)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  text: { ...Typography.body, color: Colors.textSecondary },
});
