import React from 'react';
import { FlatList, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/layout';
import { BookView } from '../application/BookService';
import { BookFilter } from '../domain/Book';
import { BookCard } from './BookCard';
import { EmptyState } from './EmptyState';
import { FilterChips, ChipOption } from './FilterChips';

const FILTERS: ChipOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'lendo', label: 'Lendo' },
  { key: 'lido', label: 'Lidos' },
  { key: 'quero_ler', label: 'Quero ler' },
];

interface LibraryScreenProps {
  books: BookView[];
  filter: BookFilter;
  onFilterChange: (filter: BookFilter) => void;
  onOpen: (book: BookView) => void;
}

/** Aba Library: filtros por status + lista de livros (notas tipadas). */
export function LibraryScreen({ books, filter, onFilterChange, onOpen }: LibraryScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={FILTERS}
          value={filter}
          onChange={(key) => onFilterChange(key as BookFilter)}
        />
      </View>

      {books.length === 0 ? (
        <EmptyState
          title={filter === 'todos' ? 'Sua estante está vazia' : 'Nada neste filtro'}
          message={
            filter === 'todos'
              ? 'Toque em + para adicionar o primeiro livro.'
              : 'Troque o filtro ou adicione um livro com esse status.'
          }
        />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.note.id}
          renderItem={({ item }) => <BookCard book={item} onPress={() => onOpen(item)} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 } as ViewStyle,
  filters: { paddingHorizontal: spacing.lg } as ViewStyle,
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  } as ViewStyle,
});