import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, spacing, typography } from '../tokens/layout';

export interface CardMeta {
  label: string;
}

interface CardProps {
  title: string;
  preview?: string;
  meta?: string[];
  tags?: string[];
  onPress?: () => void;
}

export function Card({ title, preview, meta = [], tags = [], onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {preview ? (
        <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
      ) : null}
      <View style={styles.footer}>
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.slice(0, 3).map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        ) : <View />}
        {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  } as ViewStyle,
  pressed: { opacity: 0.8 } as ViewStyle,
  title: {
    ...typography.heading,
    color: colors.text.primary,
  } as TextStyle,
  preview: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  } as ViewStyle,
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 } as ViewStyle,
  tag: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
  } as ViewStyle,
  tagText: { ...typography.meta, color: colors.oil } as TextStyle,
  meta: { ...typography.meta, color: colors.text.secondary } as TextStyle,
});