import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PinInput } from "@/components/shared/PinInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "@/lib/theme";
import type { Tarjeta } from "@/app/cards/index";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "A" | "B" | "C";
type CategoriaRecurso = "VEHICULO" | "INDUSTRIAL_MAQUINARIA";

interface OcrFields {
  estacion: string;
  importe: string;
  litros: string;
  fecha: string;
  concepto: string;
}

interface Vehiculo {
  id: number;
  nombre: string;
  matricula?: string;
  codigoObra?: string;
  categoria: CategoriaRecurso;
  centroCosteId?: number;
  centroCosteNombre?: string;
}

interface CentroCoste {
  id: number;
  nombre: string;
}

interface OcrValidadoResponse {
  status: string;
  ticketId?: number;
  message: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "A", label: "Datos" },
  { key: "B", label: "Vehículo" },
  { key: "C", label: "PIN" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <View style={stepStyles.row}>
      {STEPS.map((step, idx) => {
        const active = step.key === current;
        const done = idx < currentIdx;
        return (
          <React.Fragment key={step.key}>
            <View style={stepStyles.item}>
              <View
                style={[
                  stepStyles.circle,
                  active && stepStyles.circleActive,
                  done && stepStyles.circleDone,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.background} />
                ) : (
                  <Text
                    style={[
                      stepStyles.circleText,
                      (active || done) && stepStyles.circleTextActive,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  stepStyles.label,
                  active && stepStyles.labelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View
                style={[stepStyles.connector, done && stepStyles.connectorDone]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  item: {
    alignItems: "center",
    gap: spacing.xs,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  circleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  circleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.mutedForeground,
  },
  circleTextActive: {
    color: colors.background,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginHorizontal: spacing.xs,
  },
  connectorDone: {
    backgroundColor: colors.success,
  },
});

// ─── Step A — Datos OCR ───────────────────────────────────────────────────────

function StepA({
  fields,
  onChange,
  onContinue,
}: {
  fields: OcrFields;
  onChange: (key: keyof OcrFields, val: string) => void;
  onContinue: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepAStyles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={stepAStyles.card}>
        <View style={stepAStyles.cardHeader}>
          <Text style={stepAStyles.cardTitle}>Datos extraídos</Text>
          <TouchableOpacity
            onPress={() => setEditing((e) => !e)}
            style={stepAStyles.editBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={editing ? "checkmark-done-outline" : "create-outline"}
              size={16}
              color={colors.primary}
            />
            <Text style={stepAStyles.editBtnText}>
              {editing ? "Listo" : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        {(
          [
            { key: "estacion" as const, label: "Estación", kb: "default" as const },
            { key: "importe" as const, label: "Importe (€)", kb: "decimal-pad" as const },
            { key: "litros" as const, label: "Litros", kb: "decimal-pad" as const },
            { key: "fecha" as const, label: "Fecha", kb: "default" as const },
            { key: "concepto" as const, label: "Concepto", kb: "default" as const },
          ] as const
        ).map(({ key, label, kb }, idx, arr) => (
          <View
            key={key}
            style={[
              stepAStyles.row,
              idx === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={stepAStyles.rowLabel}>{label}</Text>
            {editing ? (
              <TextInput
                style={stepAStyles.rowInput}
                value={fields[key]}
                onChangeText={(v) => onChange(key, v)}
                keyboardType={kb}
                placeholderTextColor={colors.mutedForeground}
                selectionColor={colors.primary}
                cursorColor={colors.primary}
              />
            ) : (
              <Text style={stepAStyles.rowValue} numberOfLines={1}>
                {fields[key] || "—"}
              </Text>
            )}
          </View>
        ))}
      </View>

      <Button title="Continuar" onPress={onContinue} style={stepAStyles.cta} />
    </ScrollView>
  );
}

const stepAStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  editBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  rowValue: {
    fontSize: fontSize.md,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    flex: 2,
    textAlign: "right",
  },
  rowInput: {
    flex: 2,
    fontSize: fontSize.md,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  cta: {},
});

// ─── Step B — Vehículo / Maquinaria ──────────────────────────────────────────

function StepB({
  onContinue,
  onBack,
  categoria,
  setCategoria,
  selectedVehiculo,
  setSelectedVehiculo,
  selectedCentroCoste,
  setSelectedCentroCoste,
  selectedTarjeta,
  setSelectedTarjeta,
  kilometros,
  setKilometros,
}: {
  onContinue: () => void;
  onBack: () => void;
  categoria: CategoriaRecurso;
  setCategoria: (c: CategoriaRecurso) => void;
  selectedVehiculo: Vehiculo | null;
  setSelectedVehiculo: (v: Vehiculo | null) => void;
  selectedCentroCoste: CentroCoste | null;
  setSelectedCentroCoste: (c: CentroCoste | null) => void;
  selectedTarjeta: Tarjeta | null;
  setSelectedTarjeta: (t: Tarjeta | null) => void;
  kilometros: string;
  setKilometros: (v: string) => void;
}) {
  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ["vehiculos", categoria],
    queryFn: () =>
      apiClient.get<Vehiculo[]>(`/api/vehiculos?activo=true&categoria=${categoria}`),
  });

  const { data: centros = [] } = useQuery<CentroCoste[]>({
    queryKey: ["centros-coste"],
    queryFn: () => apiClient.get<CentroCoste[]>("/api/centros-coste?activo=true"),
  });

  const { data: tarjetas = [] } = useQuery<Tarjeta[]>({
    queryKey: ["mis-tarjetas"],
    queryFn: () => apiClient.get<Tarjeta[]>("/api/tarjetas/mis-tarjetas"),
  });

  const canContinue = selectedVehiculo !== null && selectedTarjeta !== null;

  function handleVehiculoSelect(v: Vehiculo) {
    setSelectedVehiculo(v);
    // Autorrellenar centro de coste si el vehículo lo tiene
    if (v.centroCosteId) {
      const found = centros.find((c) => c.id === v.centroCosteId);
      if (found) setSelectedCentroCoste(found);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepBStyles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Tipo de gasto */}
      <View style={stepBStyles.section}>
        <Text style={stepBStyles.sectionLabel}>Tipo de gasto</Text>
        <View style={stepBStyles.toggleRow}>
          <TouchableOpacity
            style={[
              stepBStyles.toggleBtn,
              categoria === "VEHICULO" && stepBStyles.toggleBtnActive,
            ]}
            onPress={() => {
              setCategoria("VEHICULO");
              setSelectedVehiculo(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="car-outline"
              size={18}
              color={categoria === "VEHICULO" ? colors.background : colors.mutedForeground}
            />
            <Text
              style={[
                stepBStyles.toggleBtnText,
                categoria === "VEHICULO" && stepBStyles.toggleBtnTextActive,
              ]}
            >
              Vehículo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              stepBStyles.toggleBtn,
              categoria === "INDUSTRIAL_MAQUINARIA" && stepBStyles.toggleBtnActive,
            ]}
            onPress={() => {
              setCategoria("INDUSTRIAL_MAQUINARIA");
              setSelectedVehiculo(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="construct-outline"
              size={18}
              color={
                categoria === "INDUSTRIAL_MAQUINARIA"
                  ? colors.background
                  : colors.mutedForeground
              }
            />
            <Text
              style={[
                stepBStyles.toggleBtnText,
                categoria === "INDUSTRIAL_MAQUINARIA" && stepBStyles.toggleBtnTextActive,
              ]}
            >
              Maquinaria
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehículo / Maquinaria selector */}
      <View style={stepBStyles.section}>
        <Text style={stepBStyles.sectionLabel}>
          {categoria === "VEHICULO" ? "Vehículo" : "Maquinaria"}
        </Text>
        <View style={stepBStyles.optionsList}>
          {vehiculos.length === 0 ? (
            <View style={stepBStyles.emptyOption}>
              <Text style={stepBStyles.emptyOptionText}>Sin resultados</Text>
            </View>
          ) : (
            vehiculos.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  stepBStyles.optionItem,
                  selectedVehiculo?.id === v.id && stepBStyles.optionItemSelected,
                ]}
                onPress={() => handleVehiculoSelect(v)}
                activeOpacity={0.8}
              >
                <View style={stepBStyles.optionInfo}>
                  <Text style={stepBStyles.optionName}>{v.nombre}</Text>
                  <Text style={stepBStyles.optionSub}>
                    {categoria === "VEHICULO"
                      ? v.matricula ?? "Sin matrícula"
                      : v.codigoObra ?? "Sin código"}
                  </Text>
                </View>
                {selectedVehiculo?.id === v.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Kilómetros — solo para vehículos */}
      {categoria === "VEHICULO" && (
        <View style={stepBStyles.section}>
          <Text style={stepBStyles.sectionLabel}>Kilómetros (opcional)</Text>
          <View style={stepBStyles.inputWrapper}>
            <Ionicons
              name="speedometer-outline"
              size={18}
              color={colors.mutedForeground}
              style={{ marginLeft: spacing.md }}
            />
            <TextInput
              style={stepBStyles.textInput}
              value={kilometros}
              onChangeText={setKilometros}
              placeholder="Ej: 45320"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              selectionColor={colors.primary}
              cursorColor={colors.primary}
            />
          </View>
        </View>
      )}

      {/* Centro de coste */}
      <View style={stepBStyles.section}>
        <Text style={stepBStyles.sectionLabel}>Centro de coste</Text>
        <View style={stepBStyles.optionsList}>
          {centros.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                stepBStyles.optionItem,
                selectedCentroCoste?.id === c.id && stepBStyles.optionItemSelected,
              ]}
              onPress={() => setSelectedCentroCoste(c)}
              activeOpacity={0.8}
            >
              <Text style={stepBStyles.optionName}>{c.nombre}</Text>
              {selectedCentroCoste?.id === c.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tarjeta */}
      <View style={stepBStyles.section}>
        <Text style={stepBStyles.sectionLabel}>Tarjeta de combustible</Text>
        <View style={stepBStyles.optionsList}>
          {tarjetas.length === 0 ? (
            <View style={stepBStyles.emptyOption}>
              <Text style={stepBStyles.emptyOptionText}>Sin tarjetas asignadas</Text>
            </View>
          ) : (
            tarjetas.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  stepBStyles.optionItem,
                  selectedTarjeta?.id === t.id && stepBStyles.optionItemSelected,
                ]}
                onPress={() => setSelectedTarjeta(t)}
                activeOpacity={0.8}
              >
                <View style={stepBStyles.optionInfo}>
                  <Text style={stepBStyles.optionName}>
                    {t.alias ?? `Tarjeta ${t.proveedor}`}
                  </Text>
                  <Text style={stepBStyles.optionSub}>
                    **** {t.numeroTarjetaUltimos4}
                  </Text>
                </View>
                {selectedTarjeta?.id === t.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={stepBStyles.actions}>
        <Button title="Atrás" variant="outline" onPress={onBack} style={{ flex: 1 }} />
        <Button
          title="Continuar"
          onPress={onContinue}
          disabled={!canContinue}
          style={{ flex: 2 }}
        />
      </View>
    </ScrollView>
  );
}

const stepBStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
  },
  toggleBtnTextActive: {
    color: colors.background,
  },
  optionsList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionItemSelected: {
    backgroundColor: colors.primary + "12",
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  optionSub: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
  emptyOption: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyOptionText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});

// ─── Step C — PIN + envío ─────────────────────────────────────────────────────

function StepC({
  tarjeta,
  onBack,
  onSuccess,
  uri,
  fields,
  vehiculo,
  centroCoste,
  categoria,
  kilometros,
}: {
  tarjeta: Tarjeta;
  onBack: () => void;
  onSuccess: () => void;
  uri: string;
  fields: OcrFields;
  vehiculo: Vehiculo;
  centroCoste: CentroCoste | null;
  categoria: CategoriaRecurso;
  kilometros: string;
}) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const mutation = useMutation<OcrValidadoResponse, Error, string>({
    mutationFn: async (pinValue: string) => {
      const formData = new FormData();

      const filename = uri.split("/").pop() ?? "ticket.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("imagen", {
        uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);

      const params: Record<string, unknown> = {
        tarjetaId: tarjeta.id,
        pin: pinValue,
        categoriaRecurso: categoria,
        vehiculoId: vehiculo.id,
      };
      if (centroCoste) params.centroCosteId = centroCoste.id;
      if (kilometros) params.kilometros = Number(kilometros);

      // Attach OCR data for backend validation
      Object.assign(params, {
        estacion: fields.estacion,
        importe: fields.importe ? parseFloat(fields.importe) : undefined,
        litros: fields.litros ? parseFloat(fields.litros) : undefined,
        fecha: fields.fecha,
        concepto: fields.concepto,
      });

      formData.append("params", JSON.stringify(params));

      return apiClient.upload<OcrValidadoResponse>("/api/tickets/ocr-validado", formData);
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const is401 = error.message.includes("401");
      setPinError(
        is401
          ? "PIN incorrecto. Comprueba el PIN de tu tarjeta e inténtalo de nuevo."
          : "Error al enviar el ticket. Inténtalo de nuevo.",
      );
    },
  });

  async function handleUseSavedPin() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setPinError("Biometría no disponible en este dispositivo.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verificar identidad para usar PIN guardado",
        cancelLabel: "Cancelar",
      });

      if (result.success) {
        // PIN guardado — enviar sin input manual (pin vacío como señal al backend)
        // En este flujo, el backend ya tiene el PIN guardado, se indica con pin=""
        // para que use el almacenado. Aquí enviamos el pin del input si está,
        // o indicamos "usar_guardado" como valor especial.
        // El backend ya sabe que la tarjeta tiene PIN guardado.
        mutation.mutate("__saved__");
      } else {
        setPinError("Verificación biométrica fallida.");
      }
    } catch {
      setPinError("Error al verificar biometría.");
    }
  }

  function handleSend() {
    setPinError(null);
    if (pin.length < 4) {
      setPinError("Introduce los 4 dígitos del PIN.");
      return;
    }
    mutation.mutate(pin);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={stepCStyles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tarjeta info */}
        <View style={stepCStyles.tarjetaCard}>
          <View style={stepCStyles.tarjetaRow}>
            <View style={stepCStyles.tarjetaIcon}>
              <Ionicons name="card-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={stepCStyles.tarjetaAlias}>
                {tarjeta.alias ?? `Tarjeta ${tarjeta.proveedor}`}
              </Text>
              <Text style={stepCStyles.tarjetaNum}>
                **** {tarjeta.numeroTarjetaUltimos4}
              </Text>
            </View>
          </View>

          {tarjeta.tienePinGuardado && (
            <TouchableOpacity
              style={stepCStyles.savedPinBtn}
              onPress={handleUseSavedPin}
              disabled={mutation.isPending}
              activeOpacity={0.8}
            >
              <Ionicons
                name="finger-print"
                size={18}
                color={colors.primary}
              />
              <Text style={stepCStyles.savedPinBtnText}>
                Usar PIN guardado
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        {tarjeta.tienePinGuardado && (
          <View style={stepCStyles.divider}>
            <View style={stepCStyles.dividerLine} />
            <Text style={stepCStyles.dividerText}>o introduce el PIN</Text>
            <View style={stepCStyles.dividerLine} />
          </View>
        )}

        {/* PIN title */}
        <Text style={stepCStyles.pinTitle}>PIN de tarjeta</Text>
        <Text style={stepCStyles.pinSubtitle}>
          Introduce los 4 dígitos para autorizar el ticket.
        </Text>

        {/* PIN input */}
        <View style={stepCStyles.pinContainer}>
          <PinInput
            value={pin}
            onChange={(v) => {
              setPin(v);
              if (pinError) setPinError(null);
            }}
            error={!!pinError}
          />
        </View>

        {/* PIN error */}
        {pinError && (
          <View style={stepCStyles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={stepCStyles.errorText}>{pinError}</Text>
          </View>
        )}

        {/* Loading */}
        {mutation.isPending && (
          <View style={stepCStyles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={stepCStyles.loadingText}>Enviando ticket...</Text>
          </View>
        )}

        {/* Actions */}
        <View style={stepCStyles.actions}>
          <Button
            title="Atrás"
            variant="outline"
            onPress={onBack}
            disabled={mutation.isPending}
            style={{ flex: 1 }}
          />
          <Button
            title="Enviar ticket"
            onPress={handleSend}
            loading={mutation.isPending}
            disabled={pin.length < 4}
            style={{ flex: 2 }}
            icon={
              !mutation.isPending ? (
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={colors.background}
                />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stepCStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  tarjetaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  tarjetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  tarjetaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaAlias: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  tarjetaNum: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    letterSpacing: 1.5,
  },
  savedPinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12",
  },
  savedPinBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  pinTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  pinSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
  pinContainer: {
    paddingVertical: spacing.sm,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.danger + "15",
    borderWidth: 1,
    borderColor: colors.danger + "40",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessView({ onHome }: { onHome: () => void }) {
  return (
    <View style={successStyles.container}>
      <View style={successStyles.icon}>
        <Ionicons name="checkmark" size={44} color={colors.background} />
      </View>
      <Text style={successStyles.title}>Ticket enviado</Text>
      <Text style={successStyles.subtitle}>
        Tu ticket ha sido registrado correctamente.
      </Text>
      <Button
        title="Volver al inicio"
        onPress={onHome}
        icon={<Ionicons name="home-outline" size={18} color={colors.background} />}
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
});

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  const [step, setStep] = useState<Step>("A");
  const [done, setDone] = useState(false);

  // OCR fields (editable in Step A)
  const [fields, setFields] = useState<OcrFields>({
    estacion: "",
    importe: "",
    litros: "",
    fecha: "",
    concepto: "",
  });

  // Step B selections
  const [categoria, setCategoria] = useState<CategoriaRecurso>("VEHICULO");
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [selectedCentroCoste, setSelectedCentroCoste] = useState<CentroCoste | null>(null);
  const [selectedTarjeta, setSelectedTarjeta] = useState<Tarjeta | null>(null);
  const [kilometros, setKilometros] = useState("");

  if (!uri) {
    router.replace("/scan/camera");
    return null;
  }

  if (done) {
    return (
      <SafeAreaView style={screenStyles.safe} edges={["top", "bottom"]}>
        <SuccessView onHome={() => router.dismissAll()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={screenStyles.header}>
        <TouchableOpacity
          style={screenStyles.backBtn}
          onPress={() => {
            if (step === "A") {
              router.back();
            } else if (step === "B") {
              setStep("A");
            } else {
              setStep("B");
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={screenStyles.title}>Nuevo ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stepper */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === "A" && (
        <StepA
          fields={fields}
          onChange={(key, val) => setFields((prev) => ({ ...prev, [key]: val }))}
          onContinue={() => setStep("B")}
        />
      )}

      {step === "B" && (
        <StepB
          onBack={() => setStep("A")}
          onContinue={() => setStep("C")}
          categoria={categoria}
          setCategoria={setCategoria}
          selectedVehiculo={selectedVehiculo}
          setSelectedVehiculo={setSelectedVehiculo}
          selectedCentroCoste={selectedCentroCoste}
          setSelectedCentroCoste={setSelectedCentroCoste}
          selectedTarjeta={selectedTarjeta}
          setSelectedTarjeta={setSelectedTarjeta}
          kilometros={kilometros}
          setKilometros={setKilometros}
        />
      )}

      {step === "C" && selectedVehiculo && selectedTarjeta && (
        <StepC
          tarjeta={selectedTarjeta}
          onBack={() => setStep("B")}
          onSuccess={() => setDone(true)}
          uri={uri}
          fields={fields}
          vehiculo={selectedVehiculo}
          centroCoste={selectedCentroCoste}
          categoria={categoria}
          kilometros={kilometros}
        />
      )}
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
});
