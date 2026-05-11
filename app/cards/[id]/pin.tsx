import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PinInput } from "@/components/shared/PinInput";
import { Button } from "@/components/ui/Button";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type BiometryState = "idle" | "checking" | "authenticated" | "unavailable" | "failed";

interface PinResponse {
  success: boolean;
  message: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PinScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [biometryState, setBiometryState] = useState<BiometryState>("checking");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Biometric check on mount ──────────────────────────────────────────────

  useEffect(() => {
    checkAndAuthenticate();
  }, []);

  async function checkAndAuthenticate() {
    setBiometryState("checking");
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setBiometryState("unavailable");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verificar identidad para guardar PIN",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar código",
      });

      if (result.success) {
        setBiometryState("authenticated");
      } else {
        setBiometryState("failed");
      }
    } catch {
      setBiometryState("unavailable");
    }
  }

  // ── Mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation<PinResponse, Error, string>({
    mutationFn: (pinValue: string) =>
      apiClient.post<PinResponse>(`/api/tarjetas/${id}/pin`, { pin: pinValue }),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["mis-tarjetas"] });
      setTimeout(() => {
        router.replace("/cards");
      }, 1500);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("No se pudo guardar el PIN. Inténtalo de nuevo.");
    },
  });

  function handleSave() {
    setError(null);
    if (pin.length < 4) {
      setError("Introduce los 4 dígitos del PIN.");
      return;
    }
    mutation.mutate(pin);
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={colors.background} />
          </View>
          <Text style={styles.successTitle}>PIN guardado</Text>
          <Text style={styles.successSubtitle}>
            Tu PIN ha sido guardado de forma segura.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Checking biometry ─────────────────────────────────────────────────────

  if (biometryState === "checking") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centeredText}>Verificando identidad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Biometry failed ───────────────────────────────────────────────────────

  if (biometryState === "failed") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guardar PIN</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centeredContainer}>
          <View style={styles.failedIcon}>
            <Ionicons name="finger-print" size={48} color={colors.danger} />
          </View>
          <Text style={styles.failedTitle}>Autenticación fallida</Text>
          <Text style={styles.failedBody}>
            No se pudo verificar tu identidad. Por seguridad, necesitas pasar la
            verificación biométrica para guardar el PIN.
          </Text>
          <Button
            title="Reintentar"
            onPress={checkAndAuthenticate}
            icon={<Ionicons name="refresh" size={16} color={colors.background} />}
          />
          <Button
            title="Cancelar"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form (authenticated or biometry unavailable) ─────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guardar PIN</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formContainer}>
        {/* Unavailability notice */}
        {biometryState === "unavailable" && (
          <View style={styles.noticeBanner}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.warning}
            />
            <Text style={styles.noticeText}>
              Biometría no disponible. Puedes continuar igualmente.
            </Text>
          </View>
        )}

        {/* Icon */}
        <View style={styles.lockIconContainer}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.formTitle}>PIN de 4 dígitos</Text>
        <Text style={styles.formSubtitle}>
          Introduce el PIN de tu tarjeta de combustible. Se guardará de forma segura.
        </Text>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          <PinInput value={pin} onChange={setPin} error={!!error} />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Save button */}
        <Button
          title="Guardar PIN"
          onPress={handleSave}
          loading={mutation.isPending}
          disabled={pin.length < 4}
          style={styles.saveBtn}
          icon={
            !mutation.isPending ? (
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.background} />
            ) : undefined
          }
        />

        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={mutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },

  // Loading / centered
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  centeredText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },

  // Failed biometry
  failedIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.danger + "15",
    borderWidth: 1,
    borderColor: colors.danger + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  failedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  failedBody: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },

  // Form
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warning + "15",
    borderWidth: 1,
    borderColor: colors.warning + "40",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  lockIconContainer: {
    alignItems: "center",
    paddingTop: spacing.md,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "15",
    borderWidth: 2,
    borderColor: colors.primary + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
  pinContainer: {
    paddingVertical: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.danger + "15",
    borderWidth: 1,
    borderColor: colors.danger + "40",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  successSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
