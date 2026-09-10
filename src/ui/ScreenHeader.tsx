import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../tokens/colors';
import { sizes, spacing, typography } from '../tokens/layout';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface HeaderAction {
  icon: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
}

export function ScreenHeader({ title, subtitle, actions = [] }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBox}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.accessibilityLabel}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.accessibilityLabel}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons name={a.icon} size={22} color={colors.text.secondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  } as ViewStyle,
  titleBox: { flex: 1 } as ViewStyle,
  title: { ...typography.title, color: colors.text.primary } as TextStyle,
  subtitle: { ...typography.meta, color: colors.text.secondary, marginTop: 2 } as TextStyle,
  actions: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  action: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  pressed: { opacity: 0.6 } as ViewStyle,
});