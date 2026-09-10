import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../tokens/colors';
import { radius, sizes, spacing, typography } from '../tokens/layout';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface NavItem {
  key: string;
  label: string;
  icon: IoniconName;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'surface', label: 'Surface', icon: 'home-outline' },
  { key: 'drops', label: 'Drops', icon: 'water-outline' },
  { key: 'dive', label: 'Dive', icon: 'search-outline' },
  { key: 'ocean', label: 'Ocean', icon: 'git-network-outline' },
  { key: 'more', label: 'Mais', icon: 'ellipsis-horizontal' },
];

interface BottomNavProps {
  activeKey: string;
  onSelect: (key: string) => void;
  onActionPress: () => void;
}

export function BottomNav({ activeKey, onSelect, onActionPress }: BottomNavProps) {
  // Botão central (+) inserido entre Dive e Library (posição 3 de 6)
  const before = NAV_ITEMS.slice(0, 3);
  const after = NAV_ITEMS.slice(3);

  const renderItem = (item: NavItem) => {
    const active = item.key === activeKey;
    const tint = active ? colors.water : colors.text.secondary;
    return (
      <Pressable
        key={item.key}
        onPress={() => onSelect(item.key)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        style={styles.item}
      >
        <Ionicons name={item.icon} size={22} color={tint} />
        <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
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
        <Ionicons name="add" size={28} color={colors.background.primary} />
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
    minWidth: sizes.touchTarget,
  } as ViewStyle,
  label: { ...typography.meta, marginTop: 2 } as TextStyle,
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
});