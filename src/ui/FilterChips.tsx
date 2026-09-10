import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, sizes, spacing, typography } from '../tokens/layout';

export interface ChipOption {
  key: string;
  label: string;
}

interface FilterChipsProps {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
}

/** Linha horizontal de filtros (Todos / Lendo / Lidos / Quero ler). */
export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm } as ViewStyle,
  chip: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  } as ViewStyle,
  chipActive: { backgroundColor: colors.water, borderColor: colors.water } as ViewStyle,
  pressed: { opacity: 0.75 } as ViewStyle,
  label: { ...typography.label, color: colors.text.secondary } as TextStyle,
  labelActive: { color: colors.background.primary } as TextStyle,
});