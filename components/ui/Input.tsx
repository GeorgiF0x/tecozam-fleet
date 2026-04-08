import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  /** Rendered on the left side of the input */
  icon?: React.ReactNode;
  /** Rendered on the right side of the input */
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  style?: ViewStyle;
  error?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  rightIcon,
  onRightIconPress,
  editable = true,
  autoCapitalize = "sentences",
  autoCorrect = true,
  style,
  error,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          !!error && styles.containerError,
          !editable && styles.containerDisabled,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            icon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
          ]}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.iconRight}
            hitSlop={8}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.foreground,
    marginBottom: 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  containerError: {
    borderColor: colors.danger,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  iconLeft: {
    paddingLeft: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  iconRight: {
    paddingRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 2,
  },
});
