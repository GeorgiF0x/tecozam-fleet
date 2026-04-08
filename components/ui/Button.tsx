import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

type Variant = "primary" | "outline" | "ghost" | "destructive";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: Variant;
  /** Rendered to the left of the label */
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  loading = false,
  variant = "primary",
  icon,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? colors.background : colors.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.label,
              variantStyles[variant].label,
              icon ? styles.labelWithIcon : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    minHeight: 48,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  labelWithIcon: {
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});

const variantStyles: Record<
  Variant,
  { container: ViewStyle; label: { color: string } }
> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    label: { color: colors.background },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    label: { color: colors.primary },
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
    },
    label: { color: colors.primary },
  },
  destructive: {
    container: {
      backgroundColor: colors.danger,
    },
    label: { color: colors.foreground },
  },
};
