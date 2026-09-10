import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './tokens/colors';
import { radius, sizes, spacing, typography } from './tokens/layout';
import { FileNoteRepository } from './infrastructure/FileNoteRepository';
import { NoteIndex } from './domain/Index';
import { NoteService } from './application/NoteService';
import { Note } from './domain/Note';
import { BottomNav, Button, Card, EmptyState, ScreenHeader, WTextInput } from './ui';

const repository = new FileNoteRepository();
const index = new NoteIndex();
const noteService = new NoteService(repository, index);

type SheetMode = 'closed' | 'create' | 'edit';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const all = await noteService.listNotes();
      all.sort((a, b) => (a.metadata.updated < b.metadata.updated ? 1 : -1));
      setNotes(all);
      for (const n of all) index.indexNote(n);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os Drops.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const runSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      await loadNotes();
      return;
    }
    const found = await noteService.search(text);
    setNotes(found);
  }, [loadNotes]);

  const openCreate = () => {
    setDraftTitle('');
    setDraftContent('');
    setEditingId(null);
    setSheetMode('create');
  };

  const openEdit = (note: Note) => {
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setEditingId(note.id);
    setSheetMode('edit');
  };

  const closeSheet = () => {
    if (saving) return;
    setSheetMode('closed');
    setEditingId(null);
    setDraftTitle('');
    setDraftContent('');
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
      preview={item.content.replace(/[#*_`>\-]/g, '').trim().slice(0, 160)}
      tags={item.tags}
      meta={[formatDate(item.metadata.updated)]}
      onPress={() => openEdit(item)}
    />
  );

  const headerActions = [
    {
      glyph: searching ? '×' : '⌕',
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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

      <View style={styles.footer}>
        <Button label="Nova Nota" onPress={openCreate} />
      </View>

      <BottomNav activeKey="drops" onSelect={() => {}} onActionPress={openCreate} />

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
              placeholder="Escreva em Markdown…"
              multiline
            />
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