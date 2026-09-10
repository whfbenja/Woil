import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { StatusBar } from 'expo-status-bar';
import { colors } from './tokens/colors';
import { radius, spacing, typography } from './tokens/layout';
import { FileNoteRepository } from './infrastructure/FileNoteRepository';
import { BookSearchClient } from './infrastructure/BookSearchClient';
import { NoteIndex } from './domain/Index';
import { BacklinkIndex } from './domain/BacklinkIndex';
import { NoteService } from './application/NoteService';
import { BookService } from './application/BookService';
import { Note } from './domain/Note';
import {
  BacklinkList,
  BottomNav,
  Button,
  Card,
  EmptyState,
  LibraryView,
  NoteList,
  OceanGraph,
  ScreenHeader,
  WTextInput,
  OceanEdge,
  OceanNode,
  OceanPalette,
} from './ui';

const repository = new FileNoteRepository();
const index = new NoteIndex();
const backlinkIndex = new BacklinkIndex();
const noteService = new NoteService(repository, index, backlinkIndex);
const bookService = new BookService(noteService);
const bookSearchClient = new BookSearchClient();

type SheetMode = 'closed' | 'create' | 'edit';
type Tab = 'drops' | 'ocean' | 'library';
type OceanMode = 'graph' | 'list';

const PALETTE: OceanPalette = {
  bg: colors.background.primary,
  border: colors.border,
  text: colors.text.secondary,
  note: colors.water,
  project: colors.oil,
  book: colors.book,
  tag: colors.auxiliary,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function previewOf(note: Note): string {
  return note.content.replace(/[#*_`>\-]/g, '').trim().slice(0, 160);
}

function typeOf(note: Note): string {
  const tags = note.tags.map((t) => t.toLowerCase());
  if (tags.includes('projeto') || tags.includes('project')) return 'project';
  if (tags.includes('livro') || tags.includes('book')) return 'book';
  if (tags.includes('tag')) return 'tag';
  return 'note';
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<Tab>('drops');
  const [sheetMode, setSheetMode] = useState<SheetMode>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [oceanMode, setOceanMode] = useState<OceanMode>('graph');
  const [graphNodes, setGraphNodes] = useState<OceanNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<OceanEdge[]>([]);
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});
  const [currentBacklinks, setCurrentBacklinks] = useState<Note[]>([]);
  const libraryCreateRef = useRef<(() => void) | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const all = await noteService.listNotes();
      all.sort((a, b) => (a.metadata.updated < b.metadata.updated ? 1 : -1));
      noteService.indexNotes(all);
      setNotes(all);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os Drops.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const refreshGraph = useCallback(async () => {
    const { nodes, edges } = await noteService.getGraph();
    setGraphNodes(
      nodes.map((n) => ({ id: n.id, title: n.title, type: typeOf(n) }))
    );
    setGraphEdges(edges);

    const counts: Record<string, number> = {};
    for (const note of nodes) {
      const outgoing = await noteService.getOutgoingLinks(note.id);
      const backlinks = await noteService.getBacklinks(note.id);
      counts[note.id] = outgoing.length + backlinks.length;
    }
    setLinkCounts(counts);
  }, []);

  useEffect(() => {
    if (tab === 'ocean') refreshGraph();
  }, [tab, refreshGraph]);

  const runSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (!text.trim()) {
        await loadNotes();
        return;
      }
      const found = await noteService.search(text);
      setNotes(found);
    },
    [loadNotes]
  );

  const openCreate = () => {
    setDraftTitle('');
    setDraftContent('');
    setEditingId(null);
    setCurrentBacklinks([]);
    setSheetMode('create');
  };

  const openEdit = useCallback(async (note: Note) => {
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setEditingId(note.id);
    setSheetMode('edit');
    const links = await noteService.getBacklinks(note.id);
    setCurrentBacklinks(links);
  }, []);

  const closeSheet = () => {
    if (saving) return;
    setSheetMode('closed');
    setEditingId(null);
    setDraftTitle('');
    setDraftContent('');
    setCurrentBacklinks([]);
  };

  const handleSave = async () => {
    if (!draftTitle.trim()) {
      Alert.alert('Título obrigatório', 'Dê um nome ao seu Drop antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      if (sheetMode === 'edit' && editingId) {
        await noteService.updateNote(editingId, {
          title: draftTitle.trim(),
          content: draftContent,
        });
      } else {
        await noteService.createNote({
          title: draftTitle.trim(),
          content: draftContent,
        });
      }
      await loadNotes();
      setSheetMode('closed');
      setEditingId(null);
      setDraftTitle('');
      setDraftContent('');
      setCurrentBacklinks([]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o Drop.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (note: Note) => {
    Alert.alert('Excluir Drop', `Remover "${note.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await noteService.deleteNote(note.id);
          await loadNotes();
          if (tab === 'ocean') refreshGraph();
        },
      },
    ]);
  };

  const subtitle = useMemo(() => {
    const n = notes.length;
    if (query.trim()) return `${n} resultado${n === 1 ? '' : 's'}`;
    return n === 0 ? 'Nenhum Drop ainda' : `${n} Drop${n === 1 ? '' : 's'}`;
  }, [notes.length, query]);

  const renderItem = ({ item }: { item: Note }) => (
    <Card
      title={item.title}
      preview={previewOf(item)}
      tags={item.tags}
      meta={[formatDate(item.metadata.updated)]}
      onPress={() => openEdit(item)}
    />
  );

  const headerActions = [
    {
      icon: (searching ? 'close' : 'search-outline') as 'close' | 'search-outline',
      accessibilityLabel: searching ? 'Fechar busca' : 'Buscar',
      onPress: () => {
        if (searching) {
          setQuery('');
          loadNotes();
        }
        setSearching((v) => !v);
      },
    },
  ];

  const oceanActions = [
    {
      icon: (oceanMode === 'graph' ? 'list-outline' : 'git-network-outline') as
        | 'list-outline'
        | 'git-network-outline',
      accessibilityLabel: oceanMode === 'graph' ? 'Ver como lista' : 'Ver como grafo',
      onPress: () => setOceanMode((m) => (m === 'graph' ? 'list' : 'graph')),
    },
  ];

  const centerId = useMemo(() => {
    const root = graphNodes.find((n) => n.title.toLowerCase() === 'woil');
    return root?.id;
  }, [graphNodes]);

  const listItems = useMemo(
    () => notes.map((note) => ({ note, links: linkCounts[note.id] ?? 0 })),
    [notes, linkCounts]
  );

  const renderDrops = () => (
    <>
      <View style={styles.headerWrap}>
        <ScreenHeader title="Drops" subtitle={subtitle} actions={headerActions} />
        {searching ? (
          <WTextInput
            value={query}
            onChangeText={runSearch}
            placeholder="Dive — Search"
            autoFocus
            style={styles.searchInput}
          />
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : notes.length === 0 ? (
        <EmptyState
          title={query.trim() ? 'Nada encontrado' : 'Comece seu primeiro Drop'}
          message={
            query.trim()
              ? 'Tente outro termo de busca.'
              : 'Drops são suas notas. Toque em + para capturar uma ideia.'
          }
        />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </>
  );

  const renderOcean = () => (
    <>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Ocean"
          subtitle={
            oceanMode === 'graph'
              ? `${graphNodes.length} nós · ${graphEdges.length} links`
              : `${listItems.length} notas`
          }
          actions={oceanActions}
        />
      </View>
      {oceanMode === 'graph' ? (
        <OceanGraph
          nodes={graphNodes}
          edges={graphEdges}
          palette={PALETTE}
          centerId={centerId}
          onSelectNode={(id) => {
            const note = notes.find((n) => n.id === id);
            if (note) openEdit(note);
          }}
        />
      ) : (
        <NoteList items={listItems} onPress={openEdit} />
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {tab === 'drops' ? renderDrops() : null}
      {tab === 'ocean' ? renderOcean() : null}
      {tab === 'library' ? (
        <LibraryView
          bookService={bookService}
          searchClient={bookSearchClient}
          registerCreate={(handler) => {
            libraryCreateRef.current = handler;
          }}
        />
      ) : null}

      {tab === 'drops' ? (
        <View style={styles.footer}>
          <Button label="Nova Nota" onPress={openCreate} />
        </View>
      ) : null}

      <BottomNav
        activeKey={tab}
        onSelect={(key) => {
          if (key === 'drops' || key === 'ocean' || key === 'library') setTab(key);
        }}
        onActionPress={() => {
          if (tab === 'library') {
            libraryCreateRef.current?.();
          } else {
            openCreate();
          }
        }}
      />

      <Modal
        visible={sheetMode !== 'closed'}
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
                {sheetMode === 'edit' ? 'Editar Drop' : 'Novo Drop'}
              </Text>
              <WTextInput
                label="Título"
                value={draftTitle}
                onChangeText={setDraftTitle}
                placeholder="Título do Drop"
                autoFocus
              />
              <WTextInput
                label="Conteúdo"
                value={draftContent}
                onChangeText={setDraftContent}
                placeholder="Escreva em Markdown… ([[Nota]] cria um link)"
                multiline
              />

              {sheetMode === 'edit' ? (
                <BacklinkList
                  notes={currentBacklinks}
                  onPress={(note) => {
                    if (note.id === editingId) return;
                    openEdit(note);
                  }}
                />
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

              {sheetMode === 'edit' && editingId ? (
                <Button
                  label="Excluir Drop"
                  variant="secondary"
                  onPress={() => {
                    const target = notes.find((n) => n.id === editingId);
                    if (target) {
                      closeSheet();
                      handleDelete(target);
                    }
                  }}
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
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  headerWrap: {
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  searchInput: { marginTop: spacing.sm } as ViewStyle,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  loadingText: { ...typography.body, color: colors.text.secondary } as TextStyle,
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  } as ViewStyle,
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'flex-start',
  } as ViewStyle,
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
    marginBottom: spacing.lg,
  } as TextStyle,
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  } as ViewStyle,
  sheetButton: { marginLeft: spacing.md, minWidth: 120 } as ViewStyle,
  deleteButton: { marginTop: spacing.lg } as ViewStyle,
});