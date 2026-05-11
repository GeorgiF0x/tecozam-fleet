import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
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

interface DashboardStatsAPI {
  totalFacturas: number;
  totalOperaciones: number;
  importeTotal: number;
  porcentajeCotejado: number;
  prestamosActivos: number;
  alertasPendientes: number;
  anomaliasDetectadas: number;
}

interface DashboardStats {
  gastoMes: number;
  alertasPendientes: number;
  prestamosActivos: number;
}

interface TicketAPI {
  id: number;
  fechaHora: string;
  estacion: string;
  importeTotal: number;
  estadoCotejo: string;
}

interface Ticket {
  id: number;
  fecha: string;
  estacion: string;
  importe: number;
  estado: string;
}

interface Prestamo {
  id: number;
  estado: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  color = colors.primary,
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  onPress?: () => void;
}) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={kpiStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[kpiStyles.iconBox, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={kpiStyles.value}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
      {onPress && (
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} style={{ position: "absolute", top: spacing.md, right: spacing.md }} />
      )}
    </Container>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "flex-start",
    ...shadows.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
});

function SectionCard({
  title,
  subtitle,
  icon,
  iconColor = colors.primary,
  onPress,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <View style={sectionStyles.row}>
        <View style={[sectionStyles.iconBox, { backgroundColor: iconColor + "22" }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={sectionStyles.text}>
          <Text style={sectionStyles.title}>{title}</Text>
          {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        )}
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={sectionStyles.card} onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={sectionStyles.card}>{content}</View>;
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(estado: Ticket["estado"]): string {
  const map: Record<Ticket["estado"], string> = {
    pendiente: "Pendiente",
    cotejado: "Cotejado",
    incidencia: "Incidencia",
  };
  return map[estado];
}

function statusColor(estado: Ticket["estado"]): string {
  const map: Record<Ticket["estado"], string> = {
    pendiente: colors.warning,
    cotejado: colors.success,
    incidencia: colors.danger,
  };
  return map[estado];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const firstName = user?.trabajadorNombre?.split(" ")[0] ?? user?.username ?? "Conductor";

  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const raw = await apiClient.get<DashboardStatsAPI>("/api/dashboard/stats");
      return {
        gastoMes: raw.importeTotal ?? 0,
        alertasPendientes: raw.alertasPendientes ?? 0,
        prestamosActivos: raw.prestamosActivos ?? 0,
      };
    },
    enabled: isAuth,
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ["tickets-home"],
    queryFn: async () => {
      const raw = await apiClient.get<TicketAPI[]>("/api/tickets");
      return raw.map((t) => ({
        id: t.id,
        fecha: t.fechaHora ?? "",
        estacion: t.estacion ?? "Sin estación",
        importe: t.importeTotal ?? 0,
        estado: (t.estadoCotejo ?? "pendiente").toLowerCase(),
      }));
    },
    enabled: isAuth,
  });

  const { data: prestamos } = useQuery<Prestamo[]>({
    queryKey: ["prestamos-home"],
    queryFn: async () => {
      const raw = await apiClient.get<{ id: number; estado: string }[]>("/api/prestamos");
      return raw.map((p) => ({ id: p.id, estado: (p.estado ?? "activo").toLowerCase() }));
    },
    enabled: isAuth,
  });

  const lastTicket = tickets?.[0];
  const activoCount = prestamos?.length ?? 0;
  const alertas = stats?.alertasPendientes ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {firstName}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7} onPress={() => router.push("/alerts")}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            {alertas > 0 && <View style={styles.bellBadge} />}
          </TouchableOpacity>
        </View>

        {/* ── KPIs ─────────────────────────────────────── */}
        {statsLoading ? (
          <View style={styles.kpiSkeleton}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.kpiRow}>
            <KpiCard
              label="Gasto del mes"
              value={formatCurrency(stats?.gastoMes ?? 0)}
              icon="wallet-outline"
              color={colors.primary}
            />
            <View style={{ width: spacing.md }} />
            <KpiCard
              label="Alertas"
              value={String(alertas)}
              icon="warning-outline"
              color={alertas > 0 ? colors.warning : colors.mutedForeground}
              onPress={() => router.push("/alerts")}
            />
          </View>
        )}

        {/* ── Section title ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Resumen</Text>

        {/* ── Alerts card ───────────────────────────────── */}
        <SectionCard
          title="Alertas pendientes"
          subtitle={
            alertas > 0
              ? `${alertas} alerta${alertas !== 1 ? "s" : ""} sin revisar`
              : "Sin alertas pendientes"
          }
          icon="alert-circle-outline"
          iconColor={alertas > 0 ? colors.warning : colors.mutedForeground}
          onPress={() => router.push("/alerts")}
        />

        {/* ── Loans card ────────────────────────────────── */}
        <SectionCard
          title="Mis préstamos"
          subtitle={
            activoCount > 0
              ? `${activoCount} préstamo${activoCount !== 1 ? "s" : ""} activo${activoCount !== 1 ? "s" : ""}`
              : "Sin préstamos activos"
          }
          icon="key-outline"
          iconColor={colors.info}
          onPress={() => router.push("/(tabs)/loans")}
        />

        {/* ── Last ticket ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>Último ticket</Text>
        {lastTicket ? (
          <SectionCard
            title={lastTicket.estacion}
            subtitle={`${new Date(lastTicket.fecha).toLocaleDateString("es-ES")} · ${formatCurrency(lastTicket.importe)}`}
            icon="receipt-outline"
            iconColor={colors.primary}
          >
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor(lastTicket.estado) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusColor(lastTicket.estado) },
                ]}
              >
                {statusLabel(lastTicket.estado)}
              </Text>
            </View>
          </SectionCard>
        ) : (
          <SectionCard
            title="Sin tickets registrados"
            subtitle="Escanea tu primer ticket con el botón +"
            icon="receipt-outline"
            iconColor={colors.mutedForeground}
          />
        )}
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/scan")}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

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
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
    textTransform: "capitalize",
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },

  // KPIs
  kpiRow: {
    flexDirection: "row",
    marginBottom: spacing.xl,
  },
  kpiSkeleton: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },

  // Section titles
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },

  // Status inline
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
});
