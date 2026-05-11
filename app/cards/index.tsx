import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Tarjeta {
  id: number;
  numeroTarjetaUltimos4: string;
  alias: string | null;
  proveedor: string;
  producto: string;
  centroCosteNombre: string | null;
  tienePinGuardado: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function proveedorIcon(
  proveedor: string,
): React.ComponentProps<typeof Ionicons>["name"] {
  const p = proveedor.toLowerCase();
  if (p.includes("repsol")) return "flame-outline";
  if (p.includes("moeve") || p.includes("cepsa")) return "water-outline";
  if (p.includes("bp")) return "leaf-outline";
  return "card-outline";
}

function proveedorColor(proveedor: string): string {
  const p = proveedor.toLowerCase();
  if (p.includes("repsol")) return colors.repsol;
  if (p.includes("moeve") || p.includes("cepsa")) return colors.moeve;
  return colors.primary;
}

// ─── Card item ────────────────────────────────────────────────────────────────

function TarjetaCard({
  tarjeta,
  onPinPress,
}: {
  tarjeta: Tarjeta;
  onPinPress: () => void;
}) {
  const iconName = proveedorIcon(tarjeta.proveedor);
  const iconColor = proveedorColor(tarjeta.proveedor);
  const displayName = tarjeta.alias ?? `Tarjeta ${tarjeta.proveedor}`;

  return (
    <Card style={styles.tarjetaCard}>
      <View style={styles.tarjetaRow}>
        {/* Icon */}
        <View style={[styles.proveedorIcon, { backgroundColor: iconColor + "18" }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        {/* Info */}
        <View style={styles.tarjetaInfo}>
          <Text style={styles.tarjetaAlias} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.tarjetaNumero}>**** {tarjeta.numeroTarjetaUltimos4}</Text>

          <View style={styles.badgesRow}>
            {tarjeta.producto ? (
              <Badge
                label={tarjeta.producto}
                color={{ bg: colors.primary + "20", text: colors.primary }}
                size="sm"
              />
            ) : null}
            {tarjeta.centroCosteNombre ? (
              <Badge
                label={tarjeta.centroCosteNombre}
                color={{ bg: colors.surfaceElevated, text: colors.mutedForeground }}
                size="sm"
              />
            ) : null}
          </View>
        </View>

        {/* PIN button */}
        <TouchableOpacity
          style={[
            styles.pinBtn,
            tarjeta.tienePinGuardado ? styles.pinBtnSaved : styles.pinBtnNew,
          ]}
          onPress={onPinPress}
          activeOpacity={0.75}
        >
          <Ionicons
            name={tarjeta.tienePinGuardado ? "lock-closed" : "lock-open-outline"}
            size={14}
            color={tarjeta.tienePinGuardado ? colors.success : colors.primary}
          />
          <Text
            style={[
              styles.pinBtnText,
              { color: tarjeta.tienePinGuardado ? colors.success : colors.primary },
            ]}
          >
            {tarjeta.tienePinGuardado ? "Cambiar PIN" : "Guardar PIN"}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="card-outline" size={40} color={colors.mutedForeground} />
      </View>
      <Text style={styles.emptyTitle}>Sin tarjetas asignadas</Text>
      <Text style={styles.emptyBody}>
        No tienes tarjetas de combustible asignadas. Contacta con tu responsable.
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CardsScreen() {
  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Tarjeta[]>({
    queryKey: ["mis-tarjetas"],
    queryFn: () => apiClient.get<Tarjeta[]>("/api/tarjetas/mis-tarjetas"),
  });

  const tarjetas = data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Tarjetas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Content ──────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tarjetas...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tarjetas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            tarjetas.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => (
            <TarjetaCard
              tarjeta={item}
              onPinPress={() =>
                router.push({
                  pathname: "/cards/[id]/pin",
                  params: { id: String(item.id) },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  errorTitle: {
    fontSize: fontSize.md,
    color: colors.danger,
    fontWeight: fontWeight.semibold,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Tarjeta card
  tarjetaCard: {
    ...shadows.sm,
  },
  tarjetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  proveedorIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tarjetaInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  tarjetaAlias: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  tarjetaNumero: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
    letterSpacing: 1.5,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  // PIN button
  pinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    flexShrink: 0,
  },
  pinBtnNew: {
    borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12",
  },
  pinBtnSaved: {
    borderColor: colors.success + "55",
    backgroundColor: colors.success + "12",
  },
  pinBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
});
