import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadows,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "pendiente" | "cotejado" | "incidencia" | "multiple" | "sin_coincidencia";

interface TicketAPI {
  id: number;
  fechaHora: string;
  estacion: string;
  importeTotal: number;
  litros?: number;
  estadoCotejo: string;
  concepto?: string;
  proveedorNombre?: string;
}

interface Ticket {
  id: number;
  fecha: string;
  estacion: string;
  importe: number;
  litros?: number;
  estado: TicketStatus;
}

type FilterKey = "todos" | TicketStatus;

interface FilterChip {
  key: FilterKey;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: FilterChip[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendiente" },
  { key: "cotejado", label: "Cotejado" },
  { key: "incidencia", label: "Incidencia" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: colors.warning, bg: colors.warning + "22" },
  cotejado: { label: "Cotejado", color: colors.success, bg: colors.success + "22" },
  incidencia: { label: "Incidencia", color: colors.danger, bg: colors.danger + "22" },
  multiple: { label: "Múltiple", color: colors.info, bg: colors.info + "22" },
  sin_coincidencia: { label: "Sin coincidencia", color: colors.danger, bg: colors.danger + "22" },
};

const DEFAULT_STATUS = { label: "Desconocido", color: colors.mutedForeground, bg: colors.muted };

function mapTicket(t: TicketAPI): Ticket {
  return {
    id: t.id,
    fecha: t.fechaHora,
    estacion: t.estacion ?? "Sin estación",
    importe: t.importeTotal ?? 0,
    litros: t.litros,
    estado: (t.estadoCotejo?.toLowerCase() ?? "pendiente") as TicketStatus,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Item component ───────────────────────────────────────────────────────────

function TicketItem({ item, onPress }: { item: Ticket; onPress: () => void }) {
  const status = STATUS_CONFIG[item.estado] ?? DEFAULT_STATUS;
  return (
    <TouchableOpacity style={itemStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={itemStyles.left}>
        <View style={itemStyles.iconBox}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
        </View>
      </View>
      <View style={itemStyles.body}>
        <Text style={itemStyles.station} numberOfLines={1}>
          {item.estacion}
        </Text>
        <Text style={itemStyles.date}>{formatDate(item.fecha)}</Text>
      </View>
      <View style={itemStyles.right}>
        <Text style={itemStyles.amount}>{formatCurrency(item.importe)}</Text>
        <View style={[itemStyles.badge, { backgroundColor: status.bg }]}>
          <Text style={[itemStyles.badgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  left: {
    marginRight: spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    marginRight: spacing.sm,
  },
  station: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: 2,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: 4,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons
        name="receipt-outline"
        size={48}
        color={colors.mutedForeground}
      />
      <Text style={emptyStyles.title}>
        {filtered ? "Sin resultados" : "Sin tickets"}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {filtered
          ? "No hay tickets con este filtro"
          : "Tus tickets aparecerán aquí una vez los escanees"}
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

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");

  const router = useRouter();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data: tickets = [], isLoading, refetch } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const raw = await apiClient.get<TicketAPI[]>("/api/tickets");
      return raw.map(mapTicket);
    },
    enabled: isAuth,
  });

  const filtered =
    activeFilter === "todos"
      ? tickets
      : tickets.filter((t) => t.estado === activeFilter);

  const renderItem = ({ item }: ListRenderItemInfo<Ticket>) => (
    <TicketItem item={item} onPress={() => router.push(`/ticket/${item.id}`)} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Historial</Text>
        <Text style={styles.count}>{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipsRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              activeFilter === f.key && styles.chipActive,
            ]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && { flex: 1 },
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
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState filtered={activeFilter !== "todos"} />
          ) : null
        }
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
  chipsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
