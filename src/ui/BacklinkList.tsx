import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { spacing, typography } from '../tokens/layout';
import { Note } from '../domain/Note';
import { Card } from './Card';

interface BacklinkListProps {
  notes: Note[];
  onPress: (note: Note) => void;
}

function previewOf(note: Note): string {
  return note.content.replace(/[#*_`>\-]/g, '').trim().slice(0, 120);
}

export function BacklinkList({ notes, onPress }: BacklinkListProps) {
  const count = notes.length;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {count > 0 ? `Backlinks (${count})` : 'Backlinks'}
      </Text>
      {count === 0 ? (
        <Text style={styles.empty}>Nenhuma nota referencia esta ainda</Text>
      ) : (
        notes.map((note) => (
          <Card
            key={note.id}
            title={note.title}
            preview={previewOf(note)}
            onPress={() => onPress(note)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  } as ViewStyle,
  heading: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  } as TextStyle,
  empty: {
    ...typography.meta,
    color: colors.text.secondary,
    fontStyle: 'italic',
  } as TextStyle,
});