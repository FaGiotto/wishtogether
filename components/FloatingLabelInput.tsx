import { useRef, useState, useEffect } from 'react';
import { Animated, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
  autoCorrect?: boolean;
}

export default function FloatingLabelInput({
  label, value, onChangeText,
  secureTextEntry, autoCapitalize = 'none', keyboardType, autoCorrect = false,
}: Props) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const active = focused || !!value;

  useEffect(() => {
    if (value) {
      Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: false }).start();
    }
  }, [value]);

  function handleFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: false }).start();
  }

  function handleBlur() {
    setFocused(false);
    if (!value) Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  }

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [19, 7] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={[styles.container, focused && styles.containerFocused]}>
        <Animated.Text
          style={[
            styles.label,
            { top: labelTop, fontSize: labelSize, color: active ? Colors.primary : Colors.textSecondary },
          ]}
        >
          {label}
        </Animated.Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoCorrect={autoCorrect}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  containerFocused: {
    borderColor: Colors.primary,
  },
  label: {
    position: 'absolute',
    left: Spacing.md,
    fontWeight: '400',
    backgroundColor: 'transparent',
  },
  input: {
    fontSize: 15,
    paddingTop: 22,
    paddingBottom: 6,
    color: Colors.textPrimary,
  },
});
