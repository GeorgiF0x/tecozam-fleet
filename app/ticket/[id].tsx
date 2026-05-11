import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, fontSize, fontWeight } from "@/lib/theme";

interface TicketDetail {
  id: number;
  origen: string;
  proveedorNombre?: string;
  trabajadorNombre?: string;
  estacion: string;
  direccion?: string;
  fechaHora: string;
  numTarjeta4ultimos?: string;
  matricula?: string;
  producto?: string;
  litros?: number;
  precioLitro?: number;
  importeTotal: number;
  numRecibo?: string;
  concepto?: string;
  observaciones?: string;
  estadoCotejo: string;
  operacionCotejadaId?: number;
  tipoIncidencia?: string;
  asignadoANombre?: string;
  notasResolucion?: string;
  creadoEn: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: colors.warning, bg: colors.warning + "22" },
  COTEJADO: { label: "Cotejado", color: colors.success, bg: colors.success + "22" },
  INCIDENCIA: { label: "Incidencia", color: colors.danger, bg: colors.danger + "22" },
  MULTIPLE: { label: "Múltiple", color: colors.info, bg: colors.info + "22" },
  SIN_COINCIDENCIA: { label: "Sin coincidencia", color: colors.danger, bg: colors.danger + "22" },
};

const DEFAULT_STATUS = { label: "Desconocido", color: colors.mutedForeground, bg: colors.muted };

function fmt(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{String(value)}</Text>
    </View>
  );
}

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data: ticket, isLoading } = useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: () => apiClient.get<TicketDetail>(`/api/tickets/${id}`),
    enabled: isAuth && !!id,
  });

  const status = ticket ? (STATUS_MAP[ticket.estadoCotejo] ?? DEFAULT_STATUS) : DEFAULT_STATUS;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Ticket #{id}</Text>
      </View>

      {isLoading || !ticket ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Status badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.origen}>{ticket.origen}</Text>
          </View>

          {/* Main info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos del ticket</Text>
            <Field label="Estación" value={ticket.estacion} />
            <Field label="Fecha / Hora" value={fmtDate(ticket.fechaHora)} />
            <Field label="Proveedor" value={ticket.proveedorNombre} />
            <Field label="Concepto" value={ticket.concepto ?? ticket.producto} />
            <Field label="Dirección" value={ticket.direccion} />
            <Field label="Nº Recibo" value={ticket.numRecibo} />
            <Field label="Tarjeta (últimos 4)" value={ticket.numTarjeta4ultimos} />
            <Field label="Matrícula" value={ticket.matricula} />
          </View>

          {/* Financial */}
          <View style={[styles.card, { borderColor: colors.primary + "33" }]}>
            <Text style={styles.sectionTitle}>Datos financieros</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Importe total</Text>
              <Text style={styles.amountValue}>{fmt(ticket.importeTotal)}</Text>
            </View>
            <Field label="Litros" value={ticket.litros != null ? `${ticket.litros.toFixed(2)} L` : undefined} />
            <Field label="Precio/litro" value={ticket.precioLitro != null ? `${ticket.precioLitro.toFixed(3)} €/L` : undefined} />
          </View>

          {/* Cotejo */}
          {ticket.operacionCotejadaId && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cotejo</Text>
              <Field label="Operación vinculada" value={`#${ticket.operacionCotejadaId}`} />
            </View>
          )}

          {/* Incidencia */}
          {ticket.tipoIncidencia && (
            <View style={[styles.card, { borderColor: colors.danger + "44" }]}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Incidencia</Text>
              <Field label="Tipo" value={ticket.tipoIncidencia.replace(/_/g, " ")} />
              <Field label="Asignado a" value={ticket.asignadoANombre} />
              <Field label="Observaciones" value={ticket.observaciones} />
              <Field label="Notas resolución" value={ticket.notasResolucion} />
            </View>
          )}

          {/* Meta */}
          <View style={styles.card}>
            <Field label="Trabajador" value={ticket.trabajadorNombre} />
            <Field label="Creado" value={fmtDate(ticket.creadoEn)} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.foreground },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.xl },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: "uppercase" },
  origen: { fontSize: fontSize.xs, color: colors.mutedForeground, textTransform: "uppercase" },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 0.5 },
  field: { gap: 2 },
  fieldLabel: { fontSize: fontSize.xs, color: colors.mutedForeground },
  fieldValue: { fontSize: fontSize.md, color: colors.foreground },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  amountLabel: { fontSize: fontSize.sm, color: colors.mutedForeground },
  amountValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary },
});
