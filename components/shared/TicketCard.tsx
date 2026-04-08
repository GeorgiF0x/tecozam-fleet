import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketCardProps {
  id: number;
  estacion: string;
  fechaHora: string;
  importeTotal: number;
  estadoCotejo: string;
  concepto?: string;
  litros?: number;
  onPress?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EstadoKey = "pendiente" | "cotejado" | "incidencia";

interface EstadoStyle {
  accent: string;
  bg: string;
  text: string;
  label: string;
}

const ESTADO_MAP: Record<string, EstadoStyle> = {
  pendiente: {
    accent: colors.warning,
    bg: colors.warning + "22",
    text: colors.warning,
    label: "Pendiente",
  },
  cotejado: {
    accent: colors.success,
    bg: colors.success + "22",
    text: colors.success,
    label: "Cotejado",
  },
  incidencia: {
    accent: colors.danger,
    bg: colors.danger + "22",
    text: colors.danger,
    label: "Incidencia",
  },
};

function getEstadoStyle(estado: string): EstadoStyle {
  const key = estado.toLowerCase() as EstadoKey;
  return ESTADO_MAP[key] ?? {
    accent: colors.mutedForeground,
    bg: colors.surfaceElevated,
    text: colors.mutedForeground,
    label: estado,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

const CONCEPTO_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  diesel: "water-outline",
  gasolina: "flame-outline",
  peaje: "car-outline",
  adblue: "flask-outline",
  lavado: "sparkles-outline",
  otro: "receipt-outline",
};

function conceptoIcon(concepto: string | undefined): React.ComponentProps<typeof Ionicons>["name"] {
  if (!concepto) return "receipt-outline";
  return CONCEPTO_ICON[concepto.toLowerCase()] ?? "receipt-outline";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketCard({
  estacion,
  fechaHora,
  importeTotal,
  estadoCotejo,
  concepto,
  litros,
  onPress,
}: TicketCardProps) {
  const estado = getEstadoStyle(estadoCotejo);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      accessibilityRole="button"
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: estado.accent }]} />

      {/* Main content */}
      <View style={styles.body}>
        {/* Left: icon + info */}
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: estado.accent + "22" }]}>
            <Ionicons name={conceptoIcon(concepto)} size={18} color={estado.accent} />
          </View>
          <View style={styles.info}>
            <Text style={styles.stationName} numberOfLines={1}>
              {estacion}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.date}>{formatDate(fechaHora)}</Text>
              {litros != null && (
                <>
                  <Text style={styles.separator}>·</Text>
                  <Text style={styles.litros}>{litros} L</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Right: amount + badge */}
        <View style={styles.right}>
          <Text style={styles.amount}>{formatCurrency(importeTotal)}</Text>
          <View style={[styles.badge, { backgroundColor: estado.bg }]}>
            <Text style={[styles.badgeText, { color: estado.text }]}>
              {estado.label}
            </Text>
          </View>
        </View>

        {/* Chevron if pressable */}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.mutedForeground}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  stationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  separator: {
    fontSize: fontSize.sm,
    color: colors.borderStrong,
  },
  litros: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  right: {
    alignItems: "flex-end",
    gap: spacing.xs,
    flexShrink: 0,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  badge: {
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: spacing.xs,
  },
});
