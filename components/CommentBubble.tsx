import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Comment } from '../types';
import { Colors, Spacing, Radii } from '../constants/theme';

interface Props {
  comment: Comment;
  isMe: boolean;
  onLongPress?: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function CommentBubble({ comment, isMe, onLongPress }: Props) {
  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
        style={[
          styles.bubble,
          isMe
            ? { backgroundColor: Colors.primary + '18', alignSelf: 'flex-end' }
            : { backgroundColor: Colors.surface2, alignSelf: 'flex-start' },
        ]}
      >
        {!isMe && comment.author?.display_name ? (
          <Text style={styles.author}>{comment.author.display_name}</Text>
        ) : null}
        <Text style={[styles.text, isMe && { color: Colors.primary }]}>{comment.text}</Text>
        <Text style={[styles.time, isMe && { textAlign: 'right' }]}>{formatTime(comment.created_at)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 3, paddingHorizontal: Spacing.md },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radii.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  time: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
