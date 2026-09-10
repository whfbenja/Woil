import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, spacing, typography } from '../tokens/layout';
import { BOOK_STATUSES, BOOK_STATUS_LABELS, BookStatus } from '../domain/Book';
import { StarRating } from './StarRating';
import { WTextInput } from './TextInput';

interface BookFormProps {
  title: string;
  author: string;
  coverUrl: string;
  isbn: string;
  status: BookStatus;
  rating: number;
  pagesTotal: string;
  pagesCurrent: string;
  tags: string;
  onChange: (patch: Partial<BookFormValues>) => void;
}

export interface BookFormValues {
  title: string;
  author: string;
  coverUrl: string;
  isbn: string;
  status: BookStatus;
  rating: number;
  pagesTotal: string;
  pagesCurrent: string;
  tags: string;
}

/** Formulário de livro — todos os campos são opcionais exceto o título. */
export function BookForm(props: BookFormProps) {
  const { onChange } = props;

  return (
    <View>
      <WTextInput
        label="Título"
        value={props.title}
        onChangeText={(title) => onChange({ title })}
        placeholder="Nome do livro"
      />
      <WTextInput
        label="Autor"
        value={props.author}
        onChangeText={(author) => onChange({ author })}
        placeholder="Autor"
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {BOOK_STATUSES.map((status) => {
          const active = status === props.status;
          return (
            <Pressable
              key={status}
              onPress={() => onChange({ status })}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={BOOK_STATUS_LABELS[status]}
              style={({ pressed }) => [
                styles.statusChip,
                active && styles.statusChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>
                {BOOK_STATUS_LABELS[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Avaliação</Text>
      <StarRating value={props.rating} onChange={(rating) => onChange({ rating })} />

      <View style={styles.pagesRow}>
        <View style={styles.pagesField}>
          <WTextInput
            label="Páginas (total)"
            value={props.pagesTotal}
            onChangeText={(pagesTotal) => onChange({ pagesTotal })}
            placeholder="320"
          />
        </View>
        <View style={styles.pagesField}>
          <WTextInput
            label="Página atual"
            value={props.pagesCurrent}
            onChangeText={(pagesCurrent) => onChange({ pagesCurrent })}
            placeholder="45"
          />
        </View>
      </View>

      <WTextInput
        label="Tags"
        value={props.tags}
        onChangeText={(tags) => onChange({ tags })}
        placeholder="romance, clímax"
      />
      <WTextInput
        label="ISBN"
        value={props.isbn}
        onChangeText={(isbn) => onChange({ isbn })}
        placeholder="978..."
      />
      <WTextInput
        label="URL da capa"
        value={props.coverUrl}
        onChangeText={(coverUrl) => onChange({ coverUrl })}
        placeholder="https://..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.meta,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  } as TextStyle,
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  } as ViewStyle,
  statusChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  statusChipActive: { backgroundColor: colors.book, borderColor: colors.book } as ViewStyle,
  pressed: { opacity: 0.75 } as ViewStyle,
  statusLabel: { ...typography.meta, color: colors.text.secondary } as TextStyle,
  statusLabelActive: { color: colors.background.primary } as TextStyle,
  pagesRow: { flexDirection: 'row' } as ViewStyle,
  pagesField: { flex: 1, marginRight: spacing.sm } as ViewStyle,
});