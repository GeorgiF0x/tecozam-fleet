import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistroPayload {
  nombre: string;
  apellidos: string;
  telefono: string;
  dni?: string;
  username: string;
  password: string;
}

interface RegistroResponse {
  status: "ok" | "pendiente";
  message: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const RE_TELEFONO_ES = /^(?:\+34|0034)?[6789]\d{8}$/;

function validate(fields: {
  nombre: string;
  apellidos: string;
  telefono: string;
  username: string;
  password: string;
  confirmarPassword: string;
}): Partial<Record<keyof typeof fields, string>> {
  const errors: Partial<Record<keyof typeof fields, string>> = {};

  if (!fields.nombre.trim()) errors.nombre = "El nombre es obligatorio";
  if (!fields.apellidos.trim()) errors.apellidos = "Los apellidos son obligatorios";

  const telNormalizado = fields.telefono.replace(/\s/g, "");
  if (!telNormalizado) {
    errors.telefono = "El teléfono es obligatorio";
  } else if (!RE_TELEFONO_ES.test(telNormalizado)) {
    errors.telefono = "Introduce un número de móvil español válido (6xx, 7xx, 8xx, 9xx)";
  }

  if (!fields.username.trim()) {
    errors.username = "El nombre de usuario es obligatorio";
  } else if (fields.username.includes(" ")) {
    errors.username = "El usuario no puede contener espacios";
  } else if (fields.username.trim().length < 4) {
    errors.username = "El usuario debe tener al menos 4 caracteres";
  }

  if (!fields.password) {
    errors.password = "La contraseña es obligatoria";
  } else if (fields.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  }

  if (!fields.confirmarPassword) {
    errors.confirmarPassword = "Confirma tu contraseña";
  } else if (fields.password !== fields.confirmarPassword) {
    errors.confirmarPassword = "Las contraseñas no coinciden";
  }

  return errors;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegistroScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const mutation = useMutation<RegistroResponse, Error, RegistroPayload>({
    mutationFn: (payload) =>
      apiClient.post<RegistroResponse>("/api/auth/campo/registro", payload),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRegistroExitoso(true);
    },
  });

  const handleSubmit = () => {
    const validationErrors = validate({
      nombre,
      apellidos,
      telefono,
      username,
      password,
      confirmarPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const payload: RegistroPayload = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.replace(/\s/g, ""),
      username: username.trim(),
      password,
    };

    if (dni.trim()) payload.dni = dni.trim();

    mutation.mutate(payload);
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (registroExitoso) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>¡Cuenta creada!</Text>
          <Text style={styles.successMessage}>
            Tu cuenta está pendiente de activación por un administrador. Recibirás
            aviso cuando esté lista.
          </Text>
          <Button
            title="Volver al login"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error banner from API ──────────────────────────────────────────────────

  const apiError = mutation.error
    ? mutation.error.message.replace(/^API error \d+/, "").trim() ||
      "Error al crear la cuenta. Inténtalo de nuevo."
    : null;

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────────────────────────────── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Image
                source={require("@/assets/images/tecozam-logo.png")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.appName}>
              <Text style={styles.appNameOrange}>Tecozam</Text>
              {" "}
              <Text style={styles.appNameWhite}>Fleet</Text>
            </Text>
            <Text style={styles.subtitle}>Crea tu cuenta de campo</Text>
          </View>

          {/* ── Card ────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear cuenta</Text>
            <Text style={styles.cardSubtitle}>
              Tu cuenta quedará pendiente de activación por un administrador.
            </Text>

            {/* API error banner */}
            {apiError && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.danger}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            {/* Nombre */}
            <Input
              label="Nombre"
              placeholder="Juan"
              value={nombre}
              onChangeText={(v) => { setNombre(v); setErrors((e) => ({ ...e, nombre: undefined })); }}
              autoCapitalize="words"
              autoCorrect={false}
              error={errors.nombre}
              icon={<Ionicons name="person-outline" size={18} color={colors.mutedForeground} />}
              style={styles.field}
            />

            {/* Apellidos */}
            <Input
              label="Apellidos"
              placeholder="García López"
              value={apellidos}
              onChangeText={(v) => { setApellidos(v); setErrors((e) => ({ ...e, apellidos: undefined })); }}
              autoCapitalize="words"
              autoCorrect={false}
              error={errors.apellidos}
              icon={<Ionicons name="people-outline" size={18} color={colors.mutedForeground} />}
              style={styles.field}
            />

            {/* Teléfono */}
            <Input
              label="Teléfono"
              placeholder="600 000 000"
              value={telefono}
              onChangeText={(v) => { setTelefono(v); setErrors((e) => ({ ...e, telefono: undefined })); }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.telefono}
              icon={<Ionicons name="call-outline" size={18} color={colors.mutedForeground} />}
              style={styles.field}
            />

            {/* DNI (optional) */}
            <Input
              label="DNI (opcional)"
              placeholder="12345678A"
              value={dni}
              onChangeText={setDni}
              autoCapitalize="characters"
              autoCorrect={false}
              icon={<Ionicons name="card-outline" size={18} color={colors.mutedForeground} />}
              style={styles.field}
            />

            {/* Username */}
            <Input
              label="Nombre de usuario"
              placeholder="juan.garcia"
              value={username}
              onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: undefined })); }}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              icon={<Ionicons name="at-outline" size={18} color={colors.mutedForeground} />}
              style={styles.field}
            />

            {/* Password */}
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
              icon={<Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />}
              rightIcon={
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.mutedForeground}
                />
              }
              onRightIconPress={() => setPasswordVisible((v) => !v)}
              style={styles.field}
            />

            {/* Confirmar password */}
            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={confirmarPassword}
              onChangeText={(v) => { setConfirmarPassword(v); setErrors((e) => ({ ...e, confirmarPassword: undefined })); }}
              secureTextEntry={!confirmarVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.confirmarPassword}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />}
              rightIcon={
                <Ionicons
                  name={confirmarVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.mutedForeground}
                />
              }
              onRightIconPress={() => setConfirmarVisible((v) => !v)}
              style={styles.field}
            />

            {/* Submit */}
            <Button
              title="Crear cuenta"
              onPress={handleSubmit}
              loading={mutation.isPending}
              style={styles.submitButton}
            />
          </View>

          {/* ── Back to login ────────────────────────────────── */}
          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Footer ──────────────────────────────────────── */}
          <Text style={styles.footer}>
            Tecozam Fleet © {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  // Header
  headerRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Brand
  brandContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary + "33",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  appNameOrange: {
    color: colors.primary,
  },
  appNameWhite: {
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xl,
    lineHeight: 19,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    flex: 1,
  },

  // Fields
  field: {
    marginBottom: spacing.lg,
  },

  // Submit
  submitButton: {
    marginTop: spacing.sm,
  },

  // Login link
  loginRow: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Footer
  footer: {
    textAlign: "center",
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Success screen
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  successIconBox: {
    width: 96,
    height: 96,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  successMessage: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  successButton: {
    width: "100%",
  },
});
