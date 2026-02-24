import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface Props {
  value: number; // 0 = non votato, 1–5
  interactive?: boolean;
  onSelect?: (v: number) => void;
  size?: number;
  outlined?: boolean; // true = outline + grigio (usato in creazione)
  filledColor?: string;
  emptyColor?: string;
}

export default function PriorityHearts({ value, interactive = false, onSelect, size = 26, outlined = false, filledColor, emptyColor }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const iconName: any = outlined ? (filled ? 'heart' : 'heart-outline') : 'heart';
        const resolvedFilled = filledColor ?? (outlined ? Colors.heartsDark : Colors.hearts);
        const resolvedEmpty = emptyColor ?? (outlined ? Colors.inputEmpty : Colors.hearts + '70');
        const color = filled ? resolvedFilled : resolvedEmpty;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect?.(i)}
            disabled={!interactive}
            activeOpacity={0.65}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons
              name={iconName}
              size={size}
              color={color}
              style={styles.heart}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  heart: { marginHorizontal: 1 },
});
