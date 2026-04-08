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

export interface LoanCardProps {
  tipoRecurso: string;
  recursoDescripcion: string;
  trabajadorNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFinPrevista?: string;
  onPress?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface EstadoStyle {
  bg: string;
  text: string;
  label: string;
}

const ESTADO_MAP: Record<string, EstadoStyle> = {
  activo: {
    bg: colors.success + "22",
    text: colors.success,
    label: "Activo",
  },
  devuelto: {
    bg: colors.mutedForeground + "22",
    text: colors.mutedForeground,
    label: "Devuelto",
  },
  vencido: {
    bg: colors.danger + "22",
    text: colors.danger,
    label: "Vencido",
  },
  pendiente: {
    bg: colors.warning + "22",
    text: colors.warning,
    label: "Pendiente",
  },
};

function getEstadoStyle(estado: string): EstadoStyle {
  return ESTADO_MAP[estado.toLowerCase()] ?? {
    bg: colors.surfaceElevated,
    text: colors.mutedForeground,
    label: estado,
  };
}

type ResourceIconName = React.ComponentProps<typeof Ionicons>["name"];

const RESOURCE_ICON: Record<string, ResourceIconName> = {
  vehiculo: "car-outline",
  coche: "car-outline",
  auto: "car-outline",
  tarjeta: "card-outline",
  "tarjeta combustible": "card-outline",
  radio: "radio-outline",
  walkie: "radio-outline",
  tablet: "tablet-portrait-outline",
  llave: "key-outline",
  herramienta: "construct-outline",
  otro: "briefcase-outline",
};

function resourceIcon(tipo: string): ResourceIconName {
  const key = tipo.toLowerCase();
  // Partial match
  for (const [k, icon] of Object.entries(RESOURCE_ICON)) {
    if (key.includes(k)) return icon;
  }
  return "briefcase-outline";
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

/** Returns true if fechaFinPrevista is within the next 3 days */
function isNearExpiry(fechaFinPrevista: string | undefined): boolean {
  if (!fechaFinPrevista) return false;
  try {
    const end = new Date(fechaFinPrevista).getTime();
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return end > now && end - now <= threeDays;
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoanCard({
  tipoRecurso,
  recursoDescripcion,
  trabajadorNombre,
  estado,
  fechaInicio,
  fechaFinPrevista,
  onPress,
}: LoanCardProps) {
  const estadoStyle = getEstadoStyle(estado);
  const nearExpiry = isNearExpiry(fechaFinPrevista);
  const icon = resourceIcon(tipoRecurso);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      accessibilityRole="button"
    >
      {/* Resource icon */}
      <View style={[styles.iconBox, { backgroundColor: colors.info + "22" }]}>
        <Ionicons name={icon} size={20} color={colors.info} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Top row: description + badge */}
        <View style={styles.topRow}>
          <Text style={styles.description} numberOfLines={1}>
            {recursoDescripcion}
          </Text>
          <View style={[styles.badge, { backgroundColor: estadoStyle.bg }]}>
            <Text style={[styles.badgeText, { color: estadoStyle.text }]}>
              {estadoStyle.label}
            </Text>
          </View>
        </View>

        {/* Resource type */}
        <Text style={styles.resourceType}>{tipoRecurso}</Text>

        {/* Worker */}
        <View style={styles.workerRow}>
          <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
          <Text style={styles.worker} numberOfLines={1}>
            {trabajadorNombre}
          </Text>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={styles.dateText}>Inicio: {formatDate(fechaInicio)}</Text>
          </View>
          {fechaFinPrevista && (
            <View style={styles.dateItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color={nearExpiry ? colors.warning : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.dateText,
                  nearExpiry && styles.dateTextWarning,
                ]}
              >
                Vence: {formatDate(fechaFinPrevista)}
              </Text>
            </View>
          )}
        </View>

        {/* Near expiry warning */}
        {nearExpiry && (
          <View style={styles.expiryWarning}>
            <Ionicons name="warning-outline" size={13} color={colors.warning} />
            <Text style={styles.expiryText}>Vence pronto — pendiente de devolución</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.mutedForeground}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  description: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  badge: {
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  resourceType: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  worker: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    flex: 1,
  },
  datesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  dateTextWarning: {
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },
  expiryWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warning + "18",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  expiryText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  chevron: {
    flexShrink: 0,
    marginTop: 4,
  },
});
