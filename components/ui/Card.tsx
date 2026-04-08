import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface CardProps {
  children: React.ReactNode;
  /** Renders an orange accent line on the top edge */
  accent?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, accent = false, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {accent && <View style={styles.accentBar} />}
      <View style={accent ? styles.contentWithAccent : styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.lg,
  },
  contentWithAccent: {
    padding: spacing.lg,
  },
});
