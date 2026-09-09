import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors } from './tokens/colors';
import { FileNoteRepository } from './infrastructure/FileNoteRepository';
import { NoteIndex } from './domain/Index';
import { NoteService } from './application/NoteService';
import { Note } from './domain/Note';

const repository = new FileNoteRepository();
const index = new NoteIndex();
const noteService = new NoteService(repository, index);

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadNotes = async () => {
    const all = await noteService.listNotes();
    setNotes(all);
    for (const n of all) {
      index.indexNote(n);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }
    await noteService.createNote({ title: newTitle, content: newContent });
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
    await loadNotes();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirmar', 'Excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await noteService.deleteNote(id);
          await loadNotes();
          if (selectedNote?.id === id) setSelectedNote(null);
        },
      },
    ]);
  };

  const handleSelect = (note: Note) => {
    setSelectedNote(note);
    setEditContent(note.content);
  };

  const handleUpdate = async () => {
    if (!selectedNote) return;
    await noteService.updateNote(selectedNote.id, { content: editContent });
    await loadNotes();
    setSelectedNote(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadNotes();
      return;
    }
    const found = await noteService.search(searchQuery);
    setNotes(found);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content.replace(/\\n/g, ' ').slice(0, 100)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Woil — Drops</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Dive — Search"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <Button title="Buscar" onPress={handleSearch} color={colors.water} />
        </View>
        <Button title="Nova Nota" onPress={() => setIsCreating(true)} color={colors.water} />
      </View>

      {isCreating && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Drops</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.text.secondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Conteúdo (Markdown)"
              placeholderTextColor={colors.text.secondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setIsCreating(false)} color={colors.oil} />
              <Button title="Salvar" onPress={handleCreate} color={colors.water} />
            </View>
          </View>
        </View>
      )}

      {selectedNote && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar: {selectedNote.title}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editContent}
              onChangeText={setEditContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <Button title="Excluir" onPress={() => handleDelete(selectedNote.id)} color="#ff6b6b" />
              <Button title="Fechar" onPress={() => setSelectedNote(null)} color={colors.oil} />
              <Button title="Atualizar" onPress={handleUpdate} color={colors.water} />
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  noteItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  notePreview: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});