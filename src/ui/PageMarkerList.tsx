import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, spacing, typography } from '../tokens/layout';
import { PageMarker } from '../domain/parsers/PageMarkerParser';

interface PageMarkerListProps {
  markers: PageMarker[];
}

function labelOf(marker: PageMarker): string {
  return marker.start === marker.end ? `p.${marker.start}` : `p.${marker.start}-${marker.end}`;
}

/** Lista as marcações de página já existentes na nota do livro. */
export function PageMarkerList({ markers }: PageMarkerListProps) {
  const count = markers.length;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {count > 0 ? `Marcações (${count})` : 'Marcações'}
      </Text>

      {count === 0 ? (
        <Text style={styles.empty}>Nenhuma marcação de página ainda</Text>
      ) : (
        markers.map((marker, index) => (
          <View key={`${marker.start}-${marker.end}-${index}`} style={styles.item}>
            <Text style={styles.page}>{labelOf(marker)}</Text>
            <Text style={styles.text}>{marker.text || '—'}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg } as ViewStyle,
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
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  page: { ...typography.meta, color: colors.oil } as TextStyle,
  text: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.xs,
  } as TextStyle,
});