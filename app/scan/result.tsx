import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OcrResult {
  estacion?: string;
  importe?: number;
  litros?: number;
  fecha?: string;
  concepto?: string;
}

interface EditableFields {
  estacion: string;
  importe: string;
  litros: string;
  fecha: string;
  concepto: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function DataRow({
  label,
  value,
  editable,
  field,
  fields,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  field: keyof EditableFields;
  fields: EditableFields;
  onChange: (key: keyof EditableFields, val: string) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={rowStyles.input}
          value={fields[field]}
          onChangeText={(v) => onChange(field, v)}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          keyboardType={field === "importe" || field === "litros" ? "decimal-pad" : "default"}
        />
      ) : (
        <Text style={rowStyles.value}>{value || "—"}</Text>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    flex: 2,
    textAlign: "right",
  },
  input: {
    flex: 2,
    fontSize: fontSize.md,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();

  const ocr: OcrResult = React.useMemo(() => {
    try {
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }, [data]);

  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<EditableFields>({
    estacion: ocr.estacion ?? "",
    importe: ocr.importe != null ? String(ocr.importe) : "",
    litros: ocr.litros != null ? String(ocr.litros) : "",
    fecha: ocr.fecha ?? "",
    concepto: ocr.concepto ?? "",
  });

  // ── Celebration animation ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleFieldChange(key: keyof EditableFields, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function handleAccept() {
    router.dismissAll();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const importeDisplay = fields.importe
    ? formatCurrency(parseFloat(fields.importe))
    : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Success header ───────────────────────────────── */}
        <Animated.View
          style={[
            styles.successHeader,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color={colors.background} />
          </View>
          <Text style={styles.successTitle}>Ticket procesado</Text>
          <Text style={styles.successSubtitle}>
            Los datos han sido extraídos correctamente
          </Text>
        </Animated.View>

        {/* ── Status badge ─────────────────────────────────── */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>PENDIENTE</Text>
          </View>
        </View>

        {/* ── Data card ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Datos extraídos</Text>
            <TouchableOpacity
              onPress={() => setEditing((e) => !e)}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={editing ? "checkmark-done-outline" : "create-outline"}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.editBtnText}>
                {editing ? "Listo" : "Editar datos"}
              </Text>
            </TouchableOpacity>
          </View>

          <DataRow
            label="Estación"
            value={fields.estacion}
            field="estacion"
            editable={editing}
            fields={fields}
            onChange={handleFieldChange}
          />
          <DataRow
            label="Importe"
            value={importeDisplay}
            field="importe"
            editable={editing}
            fields={fields}
            onChange={handleFieldChange}
          />
          <DataRow
            label="Litros"
            value={fields.litros ? `${fields.litros} L` : "—"}
            field="litros"
            editable={editing}
            fields={fields}
            onChange={handleFieldChange}
          />
          <DataRow
            label="Fecha"
            value={fields.fecha}
            field="fecha"
            editable={editing}
            fields={fields}
            onChange={handleFieldChange}
          />
          <DataRow
            label="Concepto"
            value={fields.concepto}
            field="concepto"
            editable={editing}
            fields={fields}
            onChange={handleFieldChange}
          />
        </View>

        {/* ── Accept button ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={handleAccept}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptBtnText}>Aceptar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Success header
  successHeader: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
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

  // Status badge
  badgeRow: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warning + "22",
    borderWidth: 1,
    borderColor: colors.warning + "55",
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.warning,
    letterSpacing: 0.8,
  },

  // Data card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  editBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // Accept button
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  acceptBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});
