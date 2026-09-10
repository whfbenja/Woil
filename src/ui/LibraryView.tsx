import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radius, spacing, typography } from '../tokens/layout';
import { BookService, BookView } from '../application/BookService';
import { BookFilter } from '../domain/Book';
import { PageMarker } from '../domain/parsers/PageMarkerParser';
import { BookSearchClient, BookSearchResult } from '../infrastructure/BookSearchClient';
import { Button } from './Button';
import { BookForm, BookFormValues } from './BookForm';
import { BookSearchResults } from './BookSearchResults';
import { LibraryScreen } from './LibraryScreen';
import { PageMarkerList } from './PageMarkerList';
import { WTextInput } from './TextInput';

const EMPTY_FORM: BookFormValues = {
  title: '',
  author: '',
  coverUrl: '',
  isbn: '',
  status: 'quero_ler',
  rating: 0,
  pagesTotal: '',
  pagesCurrent: '',
  tags: '',
};

type SheetMode = 'closed' | 'create' | 'edit';

interface LibraryViewProps {
  bookService: BookService;
  searchClient: BookSearchClient;
  /** Expõe o "novo livro" para o FAB da bottom nav. */
  registerCreate?: (handler: () => void) => void;
}

function toInt(value: string): number | undefined {
  const n = parseInt(value.trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Aba Library completa: listagem + busca na API + formulário + marcações. */
export function LibraryView({ bookService, searchClient, registerCreate }: LibraryViewProps) {
  const [books, setBooks] = useState<BookView[]>([]);
  const [filter, setFilter] = useState<BookFilter>('todos');
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<SheetMode>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookFormValues>(EMPTY_FORM);
  const [markers, setMarkers] = useState<PageMarker[]>([]);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [searching, setSearching] = useState(false);

  const [markerStart, setMarkerStart] = useState('');
  const [markerEnd, setMarkerEnd] = useState('');
  const [markerText, setMarkerText] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setBooks(await bookService.listBooks(filter));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a Library.');
    } finally {
      setLoading(false);
    }
  }, [bookService, filter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const closeSheet = useCallback(() => {
    setMode('closed');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMarkers([]);
    setResults([]);
    setSearchError(undefined);
    setQuery('');
    setMarkerStart('');
    setMarkerEnd('');
    setMarkerText('');
  }, []);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setMarkers([]);
    setEditingId(null);
    setResults([]);
    setSearchError(undefined);
    setQuery('');
    setMarkerStart('');
    setMarkerEnd('');
    setMarkerText('');
    setMode('create');
  }, []);

  useEffect(() => {
    registerCreate?.(openCreate);
  }, [registerCreate, openCreate]);

  const openEdit = (book: BookView) => {
    setForm({
      title: book.note.title,
      author: book.meta.author ?? '',
      coverUrl: book.meta.coverUrl ?? '',
      isbn: book.meta.isbn ?? '',
      status: book.meta.status,
      rating: book.meta.rating ?? 0,
      pagesTotal: book.meta.pagesTotal ? String(book.meta.pagesTotal) : '',
      pagesCurrent: book.meta.pagesCurrent !== undefined ? String(book.meta.pagesCurrent) : '',
      tags: book.note.tags.join(', '),
    });
    setMarkers(book.markers);
    setEditingId(book.note.id);
    setResults([]);
    setSearchError(undefined);
    setQuery('');
    setMarkerStart('');
    setMarkerEnd('');
    setMarkerText('');
    setMode('edit');
  };

  const patchForm = (patch: Partial<BookFormValues>) => setForm((f) => ({ ...f, ...patch }));

  /** Busca só quando o usuário confirma — nunca a cada tecla. */
  const runSearch = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setResults([]);
    setSearchError(undefined);
    try {
      const response = await searchClient.search(q);
      setResults(response.results);
      setSearchError(response.error);
    } finally {
      setSearching(false);
    }
  };

  const applyResult = (result: BookSearchResult) => {
    setForm((f) => ({
      ...f,
      title: result.title || f.title,
      author: result.author ?? f.author,
      coverUrl: result.coverUrl ?? f.coverUrl,
      isbn: result.isbn ?? f.isbn,
      pagesTotal: result.pagesTotal ? String(result.pagesTotal) : f.pagesTotal,
    }));
    setResults([]);
    setSearchError(undefined);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Título obrigatório', 'Dê um nome ao livro antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        isbn: form.isbn.trim() || undefined,
        status: form.status,
        rating: form.rating || undefined,
        pagesTotal: toInt(form.pagesTotal),
        pagesCurrent: toInt(form.pagesCurrent),
        tags: form.tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
      };

      if (mode === 'edit' && editingId) {
        await bookService.updateBook(editingId, input);
      } else {
        await bookService.createBook(input);
      }
      await reload();
      closeSheet();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o livro.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMarker = async () => {
    if (!editingId) return;
    const start = toInt(markerStart);
    if (start === undefined || start <= 0) {
      Alert.alert('Página inválida', 'Informe a página inicial da marcação.');
      return;
    }
    const end = toInt(markerEnd);
    try {
      const updated = await bookService.addPageMarker(editingId, {
        start,
        end: end && end > start ? end : undefined,
        text: markerText.trim(),
      });
      setMarkers(updated.markers);
      setMarkerStart('');
      setMarkerEnd('');
      setMarkerText('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a marcação.');
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    const target = books.find((b) => b.note.id === editingId);
    Alert.alert('Excluir livro', `Remover "${target?.note.title ?? 'este livro'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await bookService.deleteBook(editingId);
          await reload();
          closeSheet();
        },
      },
    ]);
  };

  const subtitle = `${books.length} livro${books.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : (
        <LibraryScreen
          books={books}
          filter={filter}
          onFilterChange={setFilter}
          onOpen={openEdit}
        />
      )}

      <Modal
        visible={mode !== 'closed'}
        animationType="slide"
        transparent
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetTitle}>
                {mode === 'edit' ? 'Editar Livro' : 'Novo Livro'}
              </Text>

              <Text style={styles.sectionLabel}>Buscar na Google Books (opcional)</Text>
              <WTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Título ou autor"
              />
              <Button
                label={searching ? 'Buscando…' : 'Buscar'}
                variant="secondary"
                onPress={runSearch}
                disabled={searching || !query.trim()}
                style={styles.searchButton}
              />
              <BookSearchResults
                results={results}
                loading={searching}
                error={searchError}
                onSelect={applyResult}
              />

              <Text style={styles.sectionLabel}>Preenchimento manual</Text>
              <BookForm {...form} onChange={patchForm} />

              {mode === 'edit' ? (
                <>
                  <Text style={styles.sectionLabel}>Nova marcação de página</Text>
                  <View style={styles.markerRow}>
                    <View style={styles.markerField}>
                      <WTextInput
                        label="De"
                        value={markerStart}
                        onChangeText={setMarkerStart}
                        placeholder="45"
                      />
                    </View>
                    <View style={styles.markerField}>
                      <WTextInput
                        label="Até"
                        value={markerEnd}
                        onChangeText={setMarkerEnd}
                        placeholder="52"
                      />
                    </View>
                  </View>
                  <WTextInput
                    label="Anotação"
                    value={markerText}
                    onChangeText={setMarkerText}
                    placeholder="O que você marcou nesse trecho"
                  />
                  <Button
                    label="Adicionar marcação"
                    variant="secondary"
                    onPress={handleAddMarker}
                  />
                  <PageMarkerList markers={markers} />
                </>
              ) : null}

              <View style={styles.sheetButtons}>
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onPress={closeSheet}
                  style={styles.sheetButton}
                />
                <Button
                  label={saving ? 'Salvando…' : 'Salvar'}
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.sheetButton}
                />
              </View>

              {mode === 'edit' ? (
                <Button
                  label="Excluir Livro"
                  variant="secondary"
                  onPress={handleDelete}
                  style={styles.deleteButton}
                />
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 } as ViewStyle,
  headerWrap: {
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  } as ViewStyle,
  titleRow: { flexDirection: 'row', alignItems: 'baseline' } as ViewStyle,
  title: { ...typography.title, color: colors.text.primary } as TextStyle,
  subtitle: {
    ...typography.meta,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  } as TextStyle,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  loadingText: { ...typography.body, color: colors.text.secondary } as TextStyle,
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  } as ViewStyle,
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  } as ViewStyle,
  sheetTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.md,
  } as TextStyle,
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  } as TextStyle,
  searchButton: { marginBottom: spacing.md } as ViewStyle,
  markerRow: { flexDirection: 'row' } as ViewStyle,
  markerField: { flex: 1, marginRight: spacing.sm } as ViewStyle,
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  } as ViewStyle,
  sheetButton: { marginLeft: spacing.md, minWidth: 120 } as ViewStyle,
  deleteButton: { marginTop: spacing.lg } as ViewStyle,
});