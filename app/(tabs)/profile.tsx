import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth.store";
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadows,
} from "@/lib/theme";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={avatarStyles.circle}>
      <Text style={avatarStyles.text}>{initials || "?"}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "33",
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons
        name={icon}
        size={16}
        color={colors.mutedForeground}
        style={infoRowStyles.icon}
      />
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: spacing.md,
    width: 20,
    textAlign: "center",
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
    width: 90,
  },
  value: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
});

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={toggleRowStyles.row}>
      <Ionicons
        name={icon}
        size={16}
        color={colors.mutedForeground}
        style={toggleRowStyles.icon}
      />
      <Text style={toggleRowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceElevated, true: colors.primary + "66" }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
        ios_backgroundColor={colors.surfaceElevated}
      />
    </View>
  );
}

const toggleRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: spacing.md,
    width: 20,
    textAlign: "center",
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
});

function SectionHeader({ title }: { title: string }) {
  return <Text style={sectionHeaderStyles.text}>{title}</Text>;
}

const sectionHeaderStyles = StyleSheet.create({
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const displayName = user?.trabajadorNombre ?? user?.username ?? "Usuario";
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Perfil</Text>
        </View>

        {/* ── User hero ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Avatar name={displayName} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{displayName}</Text>
            <View style={styles.rolBadge}>
              <Text style={styles.rolText}>
                {user?.rol ?? "Conductor"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Account section ───────────────────────────── */}
        <SectionHeader title="Mi cuenta" />
        <View style={styles.card}>
          <InfoRow
            icon="person-outline"
            label="Usuario"
            value={user?.username ?? "—"}
          />
          <InfoRow
            icon="briefcase-outline"
            label="Rol"
            value={user?.rol ?? "—"}
          />
          <View style={[infoRowStyles.row, { borderBottomWidth: 0 }]}>
            <Ionicons
              name="id-card-outline"
              size={16}
              color={colors.mutedForeground}
              style={infoRowStyles.icon}
            />
            <Text style={infoRowStyles.label}>ID</Text>
            <Text
              style={[infoRowStyles.value]}
              numberOfLines={1}
            >
              #{user?.id ?? "—"}
            </Text>
          </View>
        </View>

        {/* ── Settings section ──────────────────────────── */}
        <SectionHeader title="Configuración" />
        <View style={styles.card}>
          <ToggleRow
            icon="moon-outline"
            label="Modo oscuro"
            value={darkMode}
            onChange={setDarkMode}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <ToggleRow
              icon="notifications-outline"
              label="Notificaciones"
              value={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          </View>
        </View>

        {/* ── Logout ────────────────────────────────────── */}
        <SectionHeader title="Sesión" />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* ── App version ───────────────────────────────── */}
        <Text style={styles.version}>Tecozam Fleet v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },

  // Hero
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  heroInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  heroName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  rolBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary + "22",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  rolText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger + "18",
    borderWidth: 1,
    borderColor: colors.danger + "44",
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    ...shadows.sm,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },

  // Version
  version: {
    textAlign: "center",
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xl,
  },
});
