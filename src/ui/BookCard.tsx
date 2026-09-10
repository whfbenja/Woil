import React from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radius, spacing, typography } from '../tokens/layout';
import { BookView } from '../application/BookService';
import { BOOK_STATUS_LABELS } from '../domain/Book';
import { StarRating } from './StarRating';

interface BookCardProps {
  book: BookView;
  onPress: () => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  const { note, meta, progress } = book;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={note.title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {meta.coverUrl ? (
        <Image source={{ uri: meta.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverGlyph}>◫</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>
        {meta.author ? (
          <Text style={styles.author} numberOfLines={1}>
            {meta.author}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{BOOK_STATUS_LABELS[meta.status]}</Text>
          </View>
          {progress !== null ? <Text style={styles.progress}>{progress}%</Text> : null}
        </View>

        {meta.rating ? <StarRating value={meta.rating} size={14} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as ViewStyle,
  pressed: { opacity: 0.8 } as ViewStyle,
  cover: {
    width: 56,
    height: 84,
    borderRadius: radius.sm,
    backgroundColor: colors.background.secondary,
  } as ImageStyle,
  coverFallback: { alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  coverGlyph: { fontSize: 22, color: colors.border } as TextStyle,
  body: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' } as ViewStyle,
  title: { ...typography.heading, color: colors.text.primary } as TextStyle,
  author: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  } as ViewStyle,
  statusPill: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  } as ViewStyle,
  statusText: { ...typography.meta, color: colors.book } as TextStyle,
  progress: { ...typography.meta, color: colors.water } as TextStyle,
});