import React from 'react';
import { FlatList, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { spacing, typography } from '../tokens/layout';
import { Note } from '../domain/Note';
import { Card } from './Card';

interface NoteListProps {
  items: { note: Note; links: number }[];
  onPress: (note: Note) => void;
}

function previewOf(note: Note): string {
  return note.content.replace(/[#*_`>\-]/g, '').trim().slice(0, 120);
}

/** Modo Listagem da tela Ocean: fallback leve, sem D3. */
export function NoteList({ items, onPress }: NoteListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma nota no vault ainda</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.note.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Card
          title={item.note.title}
          preview={previewOf(item.note)}
          meta={[`${item.links} link${item.links === 1 ? '' : 's'}`]}
          onPress={() => onPress(item.note)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  } as ViewStyle,
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  } as ViewStyle,
  emptyText: { ...typography.body, color: colors.text.secondary } as TextStyle,
});