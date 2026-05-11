import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/lib/theme";

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Por favor ingresa tu usuario y contraseña");
      return;
    }
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Credenciales incorrectas";
      setError(message);
    }
  };

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
          {/* ── Brand ─────────────────────────────────────────── */}
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
            <Text style={styles.subtitle}>
              Sistema de control de gastos de flota
            </Text>
          </View>

          {/* ── Card ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>
            <Text style={styles.cardSubtitle}>
              Accede con tus credenciales de empresa
            </Text>

            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.danger}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Usuario</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="nombre.apellido"
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Registro ──────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.registerRow}
            onPress={() => router.push("/(auth)/registro")}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              ¿Aún no tienes cuenta?{" "}
              <Text style={styles.registerLink}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Footer ────────────────────────────────────────── */}
          <Text style={styles.footer}>
            Tecozam Fleet © {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  // Brand
  brandContainer: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary + "33",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: fontSize.xxl,
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
    lineHeight: 20,
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
  },

  // Error
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
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    flex: 1,
  },

  // Fields
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    height: "100%",
  },
  inputPassword: {
    paddingRight: spacing.sm,
  },
  eyeButton: {
    padding: spacing.xs,
  },

  // Button
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },

  // Register link
  registerRow: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Footer
  footer: {
    textAlign: "center",
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
});
