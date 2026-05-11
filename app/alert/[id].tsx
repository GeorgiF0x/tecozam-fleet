import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, fontSize, fontWeight } from "@/lib/theme";

interface AlertaDetail {
  id: number;
  prestamoId: number;
  tipoAlerta: string;
  fechaAlerta: string;
  mensaje: string;
  emailEnviado: boolean;
  leida: boolean;
  creadoEn: string;
  recursoDescripcion?: string;
  trabajadorNombre?: string;
}

interface PrestamoDetail {
  id: number;
  tipoRecurso: string;
  recursoDescripcion: string;
  trabajadorNombre: string;
  centroCosteNombre?: string;
  tipoPrestamo: string;
  estado: string;
  fechaInicio: string;
  fechaFinPrevista?: string;
  observaciones?: string;
}

const TIPO_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string; urgencia: string }> = {
  TRES_DIAS_ANTES: { icon: "calendar-outline", color: colors.info, bg: colors.info + "22", label: "3 días antes", urgencia: "Baja" },
  UN_DIA_ANTES: { icon: "alarm-outline", color: colors.warning, bg: colors.warning + "22", label: "1 día antes", urgencia: "Media" },
  MISMO_DIA: { icon: "flame-outline", color: "#F97316", bg: "#F9731622", label: "Mismo día", urgencia: "Alta" },
  VENCIDO: { icon: "skull-outline", color: colors.danger, bg: colors.danger + "22", label: "Vencido", urgencia: "Urgente" },
};

const DEFAULT_TIPO = { icon: "notifications-outline", color: colors.mutedForeground, bg: colors.muted, label: "Alerta", urgencia: "—" };

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AlertDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  // Fetch all alerts and find this one (no single-alert endpoint)
  const { data: alertas = [], isLoading: alertLoading } = useQuery<AlertaDetail[]>({
    queryKey: ["alertas-pendientes"],
    queryFn: () => apiClient.get<AlertaDetail[]>("/api/alertas/pendientes"),
    enabled: isAuth,
  });

  const alerta = alertas.find((a) => a.id === Number(id));

  // Fetch linked prestamo if we have one
  const { data: prestamo } = useQuery<PrestamoDetail>({
    queryKey: ["prestamo", alerta?.prestamoId],
    queryFn: () => apiClient.get<PrestamoDetail>(`/api/prestamos/${alerta!.prestamoId}`),
    enabled: isAuth && !!alerta?.prestamoId,
  });

  const config = alerta ? (TIPO_CONFIG[alerta.tipoAlerta] ?? DEFAULT_TIPO) : DEFAULT_TIPO;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de alerta</Text>
      </View>

      {alertLoading || !alerta ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Alert header */}
          <View style={[styles.alertHeader, { borderLeftColor: config.color }]}>
            <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon as any} size={28} color={config.color} />
            </View>
            <View style={styles.alertHeaderText}>
              <Text style={styles.alertLabel}>{config.label}</Text>
              <Text style={[styles.urgencia, { color: config.color }]}>Urgencia: {config.urgencia}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.card}>
            <Text style={styles.mensaje}>{alerta.mensaje}</Text>
          </View>

          {/* Alert info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información de la alerta</Text>
            <Field label="Tipo" value={alerta.tipoAlerta?.replace(/_/g, " ")} />
            <Field label="Fecha evaluación" value={fmtDate(alerta.fechaAlerta)} />
            <Field label="Recurso" value={alerta.recursoDescripcion} />
            <Field label="Trabajador" value={alerta.trabajadorNombre} />
            <Field label="Email enviado" value={alerta.emailEnviado ? "Sí" : "No"} />
            <Field label="Creada" value={fmtDate(alerta.creadoEn)} />
          </View>

          {/* Linked prestamo */}
          {prestamo && (
            <View style={[styles.card, { borderColor: colors.primary + "33" }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Préstamo vinculado</Text>
              <Field label="Tipo recurso" value={prestamo.tipoRecurso} />
              <Field label="Recurso" value={prestamo.recursoDescripcion} />
              <Field label="Estado" value={prestamo.estado} />
              <Field label="Tipo préstamo" value={prestamo.tipoPrestamo} />
              <Field label="Fecha inicio" value={fmtDate(prestamo.fechaInicio)} />
              <Field label="Fecha fin prevista" value={fmtDate(prestamo.fechaFinPrevista)} />
              <Field label="Centro de coste" value={prestamo.centroCosteNombre} />
              <Field label="Observaciones" value={prestamo.observaciones} />
            </View>
          )}
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
  alertHeader: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4 },
  iconBox: { width: 52, height: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  alertHeaderText: { flex: 1, gap: 4 },
  alertLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.foreground },
  urgencia: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs },
  mensaje: { fontSize: fontSize.md, color: colors.foreground, lineHeight: 22 },
  field: { gap: 2 },
  fieldLabel: { fontSize: fontSize.xs, color: colors.mutedForeground },
  fieldValue: { fontSize: fontSize.md, color: colors.foreground },
});
