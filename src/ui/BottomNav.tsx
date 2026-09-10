import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, sizes, spacing, typography } from '../tokens/layout';

export interface NavItem {
  key: string;
  label: string;
  glyph: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'surface', label: 'Surface', glyph: '◇' },
  { key: 'drops', label: 'Drops', glyph: '◍' },
  { key: 'dive', label: 'Dive', glyph: '◎' },
  { key: 'library', label: 'Library', glyph: '▤' },
  { key: 'more', label: 'Mais', glyph: '⋯' },
];

interface BottomNavProps {
  activeKey: string;
  onSelect: (key: string) => void;
  onActionPress: () => void;
}

export function BottomNav({ activeKey, onSelect, onActionPress }: BottomNavProps) {
  // Insere o botão central (+) entre Dive e Library (posição 3 de 6)
  const before = NAV_ITEMS.slice(0, 3);
  const after = NAV_ITEMS.slice(3);

  const renderItem = (item: NavItem) => {
    const active = item.key === activeKey;
    return (
      <Pressable
        key={item.key}
        onPress={() => onSelect(item.key)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={styles.item}
      >
        <Text style={[styles.glyph, active && styles.glyphActive]}>{item.glyph}</Text>
        <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      {before.map(renderItem)}
      <Pressable
        onPress={onActionPress}
        accessibilityRole="button"
        accessibilityLabel="Criar Drops"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabGlyph}>＋</Text>
      </Pressable>
      {after.map(renderItem)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: sizes.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
  } as ViewStyle,
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  } as ViewStyle,
  glyph: { fontSize: 20, color: colors.text.secondary } as TextStyle,
  glyphActive: { color: colors.water } as TextStyle,
  label: { ...typography.meta, color: colors.text.secondary, marginTop: 2 } as TextStyle,
  labelActive: { color: colors.water } as TextStyle,
  fab: {
    width: sizes.fab,
    height: sizes.fab,
    borderRadius: radius.pill,
    backgroundColor: colors.water,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  } as ViewStyle,
  fabPressed: { opacity: 0.8 } as ViewStyle,
  fabGlyph: {
    fontSize: 26,
    color: colors.background.primary,
    fontWeight: '600',
  } as TextStyle,
});