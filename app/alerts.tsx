import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ListRenderItemInfo } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, fontSize, fontWeight } from "@/lib/theme";

interface AlertaAPI {
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

const TIPO_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  TRES_DIAS_ANTES: { icon: "calendar-outline", color: colors.info, bg: colors.info + "22", label: "3 días" },
  UN_DIA_ANTES: { icon: "alarm-outline", color: colors.warning, bg: colors.warning + "22", label: "Mañana" },
  MISMO_DIA: { icon: "flame-outline", color: "#F97316", bg: "#F9731622", label: "¡Hoy!" },
  VENCIDO: { icon: "skull-outline", color: colors.danger, bg: colors.danger + "22", label: "Vencido" },
};

const DEFAULT_TIPO = { icon: "notifications-outline", color: colors.mutedForeground, bg: colors.muted, label: "Alerta" };

function formatDate(s: string) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function AlertItem({ item, onPress }: { item: AlertaAPI; onPress: () => void }) {
  const config = TIPO_CONFIG[item.tipoAlerta] ?? DEFAULT_TIPO;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.mensaje} numberOfLines={2}>{item.mensaje ?? "Alerta"}</Text>
        <View style={styles.meta}>
          {item.recursoDescripcion ? (
            <Text style={styles.metaText}>{item.recursoDescripcion}</Text>
          ) : null}
          <Text style={styles.metaText}>{formatDate(item.fechaAlerta)}</Text>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data: alertas = [], isLoading, refetch } = useQuery<AlertaAPI[]>({
    queryKey: ["alertas-pendientes"],
    queryFn: () => apiClient.get<AlertaAPI[]>("/api/alertas/pendientes"),
    enabled: isAuth,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Alertas</Text>
        <View style={styles.countBox}>
          <Text style={styles.countText}>{alertas.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : alertas.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>Todo en orden</Text>
          <Text style={styles.emptySubtitle}>No tienes alertas pendientes por el momento</Text>
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: ListRenderItemInfo<AlertaAPI>) => <AlertItem item={item} onPress={() => router.push(`/alert/${item.id}`)} />}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.foreground },
  countBox: { backgroundColor: colors.danger + "22", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.xl },
  countText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.danger },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.foreground, marginTop: spacing.lg },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 4 },
  mensaje: { fontSize: fontSize.sm, color: colors.foreground, fontWeight: fontWeight.medium },
  meta: { flexDirection: "row", gap: spacing.sm },
  metaText: { fontSize: fontSize.xs, color: colors.mutedForeground },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.xl },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold, textTransform: "uppercase" },
});
