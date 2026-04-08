import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadows,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanStatus = "activo" | "devuelto" | "vencido";
type ResourceType = "vehiculo" | "tarjeta" | "herramienta" | "equipo" | string;

interface Prestamo {
  id: number;
  tipo: ResourceType;
  descripcion: string;
  fechaInicio: string;
  fechaLimite?: string;
  estado: LoanStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; bg: string }> = {
  activo: {
    label: "Activo",
    color: colors.success,
    bg: colors.success + "22",
  },
  devuelto: {
    label: "Devuelto",
    color: colors.mutedForeground,
    bg: colors.surfaceElevated,
  },
  vencido: {
    label: "Vencido",
    color: colors.danger,
    bg: colors.danger + "22",
  },
};

const RESOURCE_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  vehiculo: "car-outline",
  tarjeta: "card-outline",
  herramienta: "build-outline",
  equipo: "hardware-chip-outline",
};

function resourceIcon(tipo: string): React.ComponentProps<typeof Ionicons>["name"] {
  return RESOURCE_ICON[tipo.toLowerCase()] ?? "key-outline";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isNearExpiry(prestamo: Prestamo): boolean {
  if (!prestamo.fechaLimite || prestamo.estado !== "activo") return false;
  return daysUntil(prestamo.fechaLimite) <= 3;
}

// ─── Item component ───────────────────────────────────────────────────────────

function LoanItem({ item }: { item: Prestamo }) {
  const status = STATUS_CONFIG[item.estado];
  const nearExpiry = isNearExpiry(item);
  const daysLeft = item.fechaLimite ? daysUntil(item.fechaLimite) : null;

  return (
    <View style={[itemStyles.card, nearExpiry && itemStyles.cardWarning]}>
      {nearExpiry && (
        <View style={itemStyles.expiryBanner}>
          <Ionicons name="time-outline" size={13} color={colors.warning} />
          <Text style={itemStyles.expiryText}>
            {daysLeft === 0
              ? "Vence hoy"
              : daysLeft === 1
              ? "Vence mañana"
              : `Vence en ${daysLeft} días`}
          </Text>
        </View>
      )}
      <View style={itemStyles.row}>
        <View style={itemStyles.iconBox}>
          <Ionicons
            name={resourceIcon(item.tipo)}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={itemStyles.body}>
          <Text style={itemStyles.description} numberOfLines={2}>
            {item.descripcion}
          </Text>
          <Text style={itemStyles.dates}>
            Desde {formatDate(item.fechaInicio)}
            {item.fechaLimite ? ` · Hasta ${formatDate(item.fechaLimite)}` : ""}
          </Text>
        </View>
        <View style={[itemStyles.badge, { backgroundColor: status.bg }]}>
          <Text style={[itemStyles.badgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardWarning: {
    borderColor: colors.warning + "66",
  },
  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning + "18",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
    gap: 4,
  },
  expiryText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: 3,
  },
  dates: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="key-outline" size={48} color={colors.mutedForeground} />
      <Text style={emptyStyles.title}>Sin préstamos</Text>
      <Text style={emptyStyles.subtitle}>
        Aquí verás los recursos que te hayan sido asignados
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoansScreen() {
  const { data: prestamos = [], isLoading, refetch } = useQuery<Prestamo[]>({
    queryKey: ["prestamos"],
    queryFn: () => apiClient.get<Prestamo[]>("/api/prestamos"),
  });

  const nearExpiryCount = prestamos.filter(isNearExpiry).length;

  const renderItem = ({ item }: ListRenderItemInfo<Prestamo>) => (
    <LoanItem item={item} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Préstamos</Text>
        <Text style={styles.count}>
          {prestamos.length} total{prestamos.length !== 1 ? "es" : ""}
        </Text>
      </View>

      {/* Warning banner */}
      {nearExpiryCount > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.warningText}>
            {nearExpiryCount} préstamo{nearExpiryCount !== 1 ? "s" : ""} próximo{nearExpiryCount !== 1 ? "s" : ""} a vencer
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={prestamos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          prestamos.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning + "18",
    borderWidth: 1,
    borderColor: colors.warning + "44",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
