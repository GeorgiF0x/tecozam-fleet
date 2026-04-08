import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { apiClient } from "@/lib/api-client";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Concepto = "Diesel" | "Gasolina" | "Peaje" | "AdBlue" | "Lavado" | "Otro";

const CONCEPTOS: Concepto[] = ["Diesel", "Gasolina", "Peaje", "AdBlue", "Lavado", "Otro"];

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      {children}
      {error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  required: {
    color: colors.danger,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 2,
  },
});

// ─── Styled text input ────────────────────────────────────────────────────────

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  editable = true,
  suffix,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
  editable?: boolean;
  suffix?: string;
  error?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        inputStyles.container,
        focused && inputStyles.focused,
        error && inputStyles.error,
        !editable && inputStyles.disabled,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[inputStyles.input, multiline && inputStyles.multiline]}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        autoCapitalize={keyboardType === "default" ? "words" : "none"}
      />
      {suffix && <Text style={inputStyles.suffix}>{suffix}</Text>}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  focused: {
    borderColor: colors.primary,
  },
  error: {
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  suffix: {
    paddingRight: spacing.md,
    fontSize: fontSize.md,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ManualRegistrationScreen() {
  const router = useRouter();

  const [estacion, setEstacion] = useState("");
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState<Concepto>("Diesel");
  const [litros, setLitros] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fechaHora, setFechaHora] = useState(formatDateTimeLocal(new Date()));
  const [loading, setLoading] = useState(false);

  // ── Validation state ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<{ estacion?: string; importe?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!estacion.trim()) newErrors.estacion = "La estación es obligatoria";
    if (!importe.trim()) {
      newErrors.importe = "El importe es obligatorio";
    } else if (isNaN(parseFloat(importe))) {
      newErrors.importe = "Introduce un importe válido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      await apiClient.post("/api/tickets", {
        estacion: estacion.trim(),
        importe: parseFloat(importe),
        concepto,
        litros: litros ? parseFloat(litros) : undefined,
        observaciones: observaciones.trim() || undefined,
        fechaHora,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Ticket registrado", "El ticket se ha guardado correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el ticket";
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nuevo ticket manual</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Estación */}
          <Field label="Estación" required error={errors.estacion}>
            <StyledInput
              value={estacion}
              onChangeText={setEstacion}
              placeholder="Nombre de la estación"
              error={!!errors.estacion}
            />
          </Field>

          {/* Importe */}
          <Field label="Importe" required error={errors.importe}>
            <StyledInput
              value={importe}
              onChangeText={setImporte}
              placeholder="0.00"
              keyboardType="decimal-pad"
              suffix="€"
              error={!!errors.importe}
            />
          </Field>

          {/* Concepto chips */}
          <Field label="Concepto">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {CONCEPTOS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, concepto === c && styles.chipActive]}
                  onPress={() => setConcepto(c)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      concepto === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          {/* Litros */}
          <Field label="Litros">
            <StyledInput
              value={litros}
              onChangeText={setLitros}
              placeholder="Opcional"
              keyboardType="decimal-pad"
            />
          </Field>

          {/* Observaciones */}
          <Field label="Observaciones">
            <StyledInput
              value={observaciones}
              onChangeText={setObservaciones}
              placeholder="Notas adicionales (opcional)"
              multiline
            />
          </Field>

          {/* Fecha/Hora */}
          <Field label="Fecha / Hora">
            <StyledInput
              value={fechaHora}
              onChangeText={setFechaHora}
              placeholder="AAAA-MM-DDTHH:MM"
            />
          </Field>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
                <Text style={styles.submitText}>Registrar ticket</Text>
              </>
            )}
          </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // Chips
  chipsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + "22",
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 50,
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});
