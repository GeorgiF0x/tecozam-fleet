// ─── Cotejo status colors ─────────────────────────────────────────────────────

export type EstadoCotejo =
  | "PENDIENTE"
  | "COTEJADO"
  | "MULTIPLE"
  | "SIN_COINCIDENCIA"
  | "INCIDENCIA";

export const ESTADO_COTEJO_COLORS: Record<
  EstadoCotejo,
  { bg: string; text: string }
> = {
  PENDIENTE: { bg: "#FACC1520", text: "#FACC15" },
  COTEJADO: { bg: "#22C55E20", text: "#22C55E" },
  MULTIPLE: { bg: "#3B82F620", text: "#3B82F6" },
  SIN_COINCIDENCIA: { bg: "#EF444420", text: "#EF4444" },
  INCIDENCIA: { bg: "#EF444420", text: "#EF4444" },
};

export const ESTADO_COTEJO_LABELS: Record<EstadoCotejo, string> = {
  PENDIENTE: "Pendiente",
  COTEJADO: "Cotejado",
  MULTIPLE: "Múltiple",
  SIN_COINCIDENCIA: "Sin coincidencia",
  INCIDENCIA: "Incidencia",
};

// ─── Concepto options ─────────────────────────────────────────────────────────

export const CONCEPTO_OPTIONS = [
  "Diesel",
  "Gasolina",
  "Peaje",
  "AdBlue",
  "Lavado",
  "Otro",
] as const;

export type Concepto = (typeof CONCEPTO_OPTIONS)[number];

// ─── Tipo recurso ─────────────────────────────────────────────────────────────

export type TipoRecurso = "TARJETA" | "VIAT" | "VEHICULO";

// Icon names map to @expo/vector-icons (Ionicons family)
export const TIPO_RECURSO_ICONS: Record<TipoRecurso, string> = {
  TARJETA: "card",
  VIAT: "radio",
  VEHICULO: "car",
};

export const TIPO_RECURSO_LABELS: Record<TipoRecurso, string> = {
  TARJETA: "Tarjeta",
  VIAT: "Viat",
  VEHICULO: "Vehículo",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;

// ─── Date / time ──────────────────────────────────────────────────────────────

export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
