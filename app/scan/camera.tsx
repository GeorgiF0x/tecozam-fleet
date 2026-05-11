import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fontSize, fontWeight, radius, spacing } from "@/lib/theme";

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<"on" | "off">("off");
  const [capturing, setCapturing] = useState(false);

  // ─── Permission not yet resolved ─────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ─── Permission denied ────────────────────────────────────────────────────────

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.permissionBody}>
            Necesitamos acceso a tu cámara para escanear tickets de combustible.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionBtnText}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Text style={styles.closeBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        imageType: "jpg",
      });
      if (photo?.uri) {
        router.push({ pathname: "/scan/preview", params: { uri: photo.uri } });
      }
    } finally {
      setCapturing(false);
    }
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: "/scan/preview",
        params: { uri: result.assets[0].uri },
      });
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        zoom={0}
        autofocus="on"
      />

      {/* ── Overlay ─── */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Escanear ticket</Text>

          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            hitSlop={8}
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={22}
              color={flash === "on" ? colors.warning : colors.foreground}
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Frame guide — vertically centered in the viewport */}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.frameHint}>
            Centra el ticket dentro del recuadro
          </Text>
        </View>

        {/* Bottom controls */}
        <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
          {/* Gallery button */}
          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={handleGallery}
            activeOpacity={0.75}
          >
            <Ionicons name="images-outline" size={22} color={colors.foreground} />
            <Text style={styles.galleryText}>Galería</Text>
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity
            style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            activeOpacity={0.85}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          {/* Spacer to balance the gallery button */}
          <View style={styles.galleryBtn} />
        </SafeAreaView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FRAME_W = 320;
const FRAME_H = 420;
const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Permission screen ────────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  permissionBody: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  permissionBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
  closeBtn: {
    paddingVertical: spacing.sm,
  },
  closeBtnText: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
  },

  // ── Camera overlay ───────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  topIconBtn: {
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

  // ── Frame area ───────────────────────────────────────────────────────────────
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: radius.lg,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: radius.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: radius.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: radius.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: radius.md,
  },
  frameHint: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  galleryBtn: {
    width: 70,
    alignItems: "center",
    gap: spacing.xs,
  },
  galleryText: {
    fontSize: fontSize.xs,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  captureBtnDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.foreground,
  },
});
