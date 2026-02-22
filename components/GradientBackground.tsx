import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: object;
}

export default function GradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Blob top-left viola */}
      <View style={styles.blobTopLeft} />
      {/* Blob bottom-right rosa */}
      <View style={styles.blobBottomRight} />
      {/* Blob center rosa chiaro */}
      <View style={styles.blobCenter} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    overflow: 'hidden',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#C4B5FD',
    opacity: 0.35,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FBCFE8',
    opacity: 0.4,
  },
  blobCenter: {
    position: 'absolute',
    top: '40%',
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#BAE6FD',
    opacity: 0.2,
  },
});
