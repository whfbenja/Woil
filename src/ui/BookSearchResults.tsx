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
import { BookSearchResult } from '../infrastructure/BookSearchClient';

interface BookSearchResultsProps {
  results: BookSearchResult[];
  loading?: boolean;
  error?: string;
  onSelect: (result: BookSearchResult) => void;
}

/** Resultados da Google Books API, prontos para preencher o formulário. */
export function BookSearchResults({
  results,
  loading = false,
  error,
  onSelect,
}: BookSearchResultsProps) {
  if (loading) {
    return <Text style={styles.info}>Buscando…</Text>;
  }

  if (error) {
    return <Text style={styles.info}>{error}</Text>;
  }

  if (results.length === 0) return null;

  return (
    <View style={styles.container}>
      {results.map((result, index) => (
        <Pressable
          key={`${result.title}-${index}`}
          onPress={() => onSelect(result)}
          accessibilityRole="button"
          accessibilityLabel={result.title}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          {result.coverUrl ? (
            <Image source={{ uri: result.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Text style={styles.coverGlyph}>◫</Text>
            </View>
          )}
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {result.title}
            </Text>
            {result.author ? (
              <Text style={styles.author} numberOfLines={1}>
                {result.author}
              </Text>
            ) : null}
            {result.pagesTotal ? (
              <Text style={styles.meta}>{result.pagesTotal} páginas</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md } as ViewStyle,
  info: {
    ...typography.meta,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  } as TextStyle,
  item: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  pressed: { opacity: 0.8 } as ViewStyle,
  cover: { width: 40, height: 60, borderRadius: radius.sm } as ImageStyle,
  coverFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  } as ImageStyle,
  coverGlyph: { fontSize: 16, color: colors.border } as TextStyle,
  body: { flex: 1, marginLeft: spacing.sm, justifyContent: 'center' } as ViewStyle,
  title: { ...typography.label, color: colors.text.primary } as TextStyle,
  author: { ...typography.meta, color: colors.text.secondary } as TextStyle,
  meta: { ...typography.meta, color: colors.water } as TextStyle,
});