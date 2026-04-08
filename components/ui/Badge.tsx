import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontSize, radius, spacing } from "@/lib/theme";

interface BadgeProps {
  label: string;
  /** Object with bg (background hex) and text (text hex) */
  color: { bg: string; text: string };
  size?: "sm" | "md";
}

export function Badge({ label, color, size = "md" }: BadgeProps) {
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: color.bg },
        isSm ? styles.containerSm : styles.containerMd,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: color.text },
          isSm ? styles.textSm : styles.textMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radius.xxl,
  },
  containerSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  containerMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
  textSm: {
    fontSize: fontSize.xs,
  },
  textMd: {
    fontSize: fontSize.sm,
  },
});
