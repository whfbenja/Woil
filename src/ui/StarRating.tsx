import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { spacing, typography } from '../tokens/layout';

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: number;
}

const STARS = [1, 2, 3, 4, 5];

/**
 * Avaliação 0–5 com meio ponto.
 * Somente leitura quando `onChange` não é passado. Ao editar: tocar na
 * estrela N define N; tocar de novo na mesma estrela define N - 0.5.
 */
export function StarRating({ value = 0, onChange, size = 20 }: StarRatingProps) {
  const editable = typeof onChange === 'function';

  return (
    <View style={styles.row}>
      {STARS.map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;
        const glyphStyle: TextStyle = {
          fontSize: size,
          color: filled || half ? colors.oil : colors.border,
          opacity: half ? 0.55 : 1,
        };
        const content = <Text style={glyphStyle}>★</Text>;

        if (!editable) {
          return (
            <View key={star} style={styles.star}>
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Avaliar com ${star} estrela${star === 1 ? '' : 's'}`}
            onPress={() => onChange?.(value === star ? star - 0.5 : star)}
            style={styles.star}
          >
            {content}
          </Pressable>
        );
      })}
      {editable ? (
        <Text style={styles.value}>{value ? value.toFixed(1).replace('.0', '') : '—'}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  star: { paddingHorizontal: 2, paddingVertical: 4 } as ViewStyle,
  value: {
    ...typography.meta,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  } as TextStyle,
});