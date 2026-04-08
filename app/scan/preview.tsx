import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "@/lib/api-client";
import { colors, fontSize, fontWeight, radius, spacing } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OcrResult {
  estacion?: string;
  importe?: number;
  litros?: number;
  fecha?: string;
  concepto?: string;
  [key: string]: unknown;
}

export default function PreviewScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!uri) {
    router.replace("/scan/camera");
    return null;
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleSend() {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() ?? "ticket.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);

      const result = await apiClient.upload<OcrResult>("/api/tickets/ocr", formData);
      router.replace({ pathname: "/scan/result", params: { data: JSON.stringify(result) } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al procesar el ticket";
      setError(msg);
    } finally {
      setLoading(false);
    }
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

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Procesando ticket con IA...</Text>
          </View>
        </View>
      )}

      {/* Bottom bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGhost]}
            onPress={handleRetake}
            disabled={loading}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnGhostText}>Repetir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, loading && styles.disabledBtn]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.background} />
            <Text style={styles.actionBtnPrimaryText}>Enviar</Text>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.lg,
    minWidth: 220,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
    textAlign: "center",
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.danger + "22",
    borderWidth: 1,
    borderColor: colors.danger + "55",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.danger,
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
  disabledBtn: {
    opacity: 0.5,
  },
});
