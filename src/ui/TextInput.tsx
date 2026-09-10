import React, { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, View, Text, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius, sizes, spacing, typography } from '../tokens/layout';

interface WTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export function WTextInput({
  value,
  onChangeText,
  placeholder,
  label,
  multiline = false,
  autoFocus = false,
  style,
}: WTextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        autoFocus={autoFocus}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md } as ViewStyle,
  label: {
    ...typography.meta,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  } as TextStyle,
  input: {
    backgroundColor: colors.surface,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: sizes.inputHeight,
    fontSize: typography.body.fontSize,
  } as TextStyle,
  focused: { borderColor: colors.water } as TextStyle,
  multiline: { minHeight: 140, paddingTop: spacing.md } as TextStyle,
});