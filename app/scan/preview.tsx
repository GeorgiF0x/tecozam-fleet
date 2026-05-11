import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, fontSize, fontWeight, radius, spacing } from "@/lib/theme";

export default function PreviewScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  if (!uri) {
    router.replace("/scan/camera");
    return null;
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleSend() {
    // Navigate directly to result — OCR + PIN + submit happen there
    router.replace({ pathname: "/scan/result", params: { uri } });
  }

  function handleRetake() {
    router.replace("/scan/camera");
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Full screen image */}
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Top back button */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Vista previa</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Bottom bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGhost]}
            onPress={handleRetake}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnGhostText}>Repetir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.background} />
            <Text style={styles.actionBtnPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 50,
  },
  actionBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnGhostText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});
