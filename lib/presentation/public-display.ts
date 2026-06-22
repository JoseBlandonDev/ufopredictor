import type { MatchRow } from "@/types/database";
import teamDisplayNamesSource from "../../data/prediction-engine/national-team-signals/2026-06-19/team-display-names-es-en.json";

export type PublicLocale = "es" | "en";

type TeamDisplayNamesSource = {
  teams: Array<{
    teamKey: string;
    databaseNameEn: string;
    displayNameEs: string;
    aliases?: string[];
  }>;
};

type TeamDisplayEntry = {
  databaseNameEn: string;
  displayNameEs: string;
  aliases: string[];
};

const ACTIVE_PUBLIC_LOCALE: PublicLocale = "es";
const COT_TIME_ZONE = "America/Bogota";
const COT_TIME_ZONE_LABEL = "COT";
const WORLD_CUP_PRODUCT_NAME = {
  es: "Pase Mundial 2026",
  en: "2026 World Cup Pass",
} as const;

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applySpanishDisplayOverrides(entry: TeamDisplayEntry) {
  const overrideMap: Record<string, string> = {
    "cape-verde-islands": "Cabo Verde",
    "cape-verde": "Cabo Verde",
    "saudi-arabia": "Arabia Saudita",
    "south-africa": "Sudáfrica",
    "new-zealand": "Nueva Zelanda",
    "ivory-coast": "Costa de Marfil",
    "netherlands": "Países Bajos",
    "germany": "Alemania",
    "sweden": "Suecia",
    "united-states": "Estados Unidos",
    usa: "Estados Unidos",
  };

  for (const alias of [entry.databaseNameEn, ...entry.aliases]) {
    const normalizedAlias = normalizeValue(alias);
    if (overrideMap[normalizedAlias]) {
      return {
        ...entry,
        displayNameEs: overrideMap[normalizedAlias],
      };
    }
  }

  return entry;
}

const teamEntries = ((teamDisplayNamesSource as TeamDisplayNamesSource).teams ?? []).map((team) =>
  applySpanishDisplayOverrides({
    databaseNameEn: team.databaseNameEn,
    displayNameEs: team.displayNameEs,
    aliases: [...new Set([team.databaseNameEn, ...(team.aliases ?? [])])],
  }),
);

const spanishTeamNamesByAlias = new Map<string, string>();
const englishTeamNamesByAlias = new Map<string, string>();

for (const entry of teamEntries) {
  for (const alias of [...entry.aliases, entry.displayNameEs]) {
    const normalizedAlias = normalizeValue(alias);
    if (!normalizedAlias) continue;

    spanishTeamNamesByAlias.set(normalizedAlias, entry.displayNameEs);
    englishTeamNamesByAlias.set(normalizedAlias, entry.databaseNameEn);
  }
}

const competitionNames: Record<string, { es: string; en: string }> = {
  "world cup 2026": {
    es: "Mundial 2026",
    en: "World Cup 2026",
  },
};

const stageLabelsEs: Array<[RegExp, string]> = [
  [/^(group|grupo)\s*([a-h])$/i, "Grupo $2"],
  [/^group stage(?:\s*-\s*\d+)?$/i, "Fase de grupos"],
  [/^(round[_\s-]?of[_\s-]?16|octavos)$/i, "Octavos de final"],
  [/^(quarterfinal|quarter-final|cuartos)$/i, "Cuartos de final"],
  [/^(semifinal|semi-final|semifinales)$/i, "Semifinal"],
  [/^third(?:\s|-)?place$/i, "Tercer puesto"],
  [/^final$/i, "Final"],
];

const matchStatusLabels: Record<MatchRow["status"], Record<PublicLocale, string>> = {
  scheduled: { es: "Programado", en: "Scheduled" },
  live: { es: "En vivo", en: "Live" },
  finished: { es: "Finalizado", en: "Finished" },
  postponed: { es: "Aplazado", en: "Postponed" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

const marketGlossary = [
  {
    key: "1x2",
    title: "1X2",
    description:
      "Probabilidad estimada de victoria local, empate o victoria visitante.",
  },
  {
    key: "xg",
    title: "Goles esperados (xG)",
    description:
      "Promedio estimado de goles que el modelo asigna a cada equipo. No es un marcador garantizado.",
  },
  {
    key: "btts",
    title: "Ambos equipos marcan (BTTS)",
    description:
      "Probabilidad de que los dos equipos anoten al menos un gol.",
  },
  {
    key: "over-2-5",
    title: "Más de 2,5 goles",
    description:
      "Probabilidad de que el partido termine con tres goles o más.",
  },
  {
    key: "under-2-5",
    title: "Menos de 2,5 goles",
    description:
      "Probabilidad de que el partido termine con dos goles o menos.",
  },
  {
    key: "confidence",
    title: "Confianza",
    description:
      "Resume qué tan estable y consistente es la lectura actual del modelo para este partido.",
  },
  {
    key: "risk",
    title: "Riesgo",
    description:
      "Describe la incertidumbre o la posibilidad de que el partido se aleje del escenario central del modelo.",
  },
] as const;

const premiumMarketLabels: Record<string, string> = {
  btts: "Ambos equipos marcan (BTTS)",
  over_2_5: "Más / Menos de 2,5 goles",
  exact_score: "Marcador exacto",
  match_winner: "Ganador del partido",
};

const premiumMarketSelections: Record<string, string> = {
  yes: "Sí",
  no: "No",
  over: "Más de 2,5",
  under: "Menos de 2,5",
  home: "Victoria local",
  away: "Victoria visitante",
  draw: "Empate",
};

export function getActivePublicLocale() {
  return ACTIVE_PUBLIC_LOCALE;
}

export function getWorldCupProductName(locale: PublicLocale = ACTIVE_PUBLIC_LOCALE) {
  return WORLD_CUP_PRODUCT_NAME[locale];
}

export function resolveTeamDisplayName(
  name: string | null | undefined,
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  if (!name) {
    return "";
  }

  const normalizedName = normalizeValue(name);
  if (!normalizedName) {
    return name;
  }

  if (locale === "en") {
    return englishTeamNamesByAlias.get(normalizedName) ?? name;
  }

  return spanishTeamNamesByAlias.get(normalizedName) ?? name;
}

export function resolveCompetitionDisplayName(
  competitionName: string | null | undefined,
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  if (!competitionName) {
    return "";
  }

  const normalizedName = competitionName.trim().toLowerCase();
  return competitionNames[normalizedName]?.[locale] ?? competitionName;
}

export function resolveStageDisplayName(
  stage: string | null | undefined,
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  if (!stage) {
    return "";
  }

  if (locale === "en") {
    return stage;
  }

  for (const [pattern, replacement] of stageLabelsEs) {
    if (pattern.test(stage)) {
      return stage.replace(pattern, replacement);
    }
  }

  return stage;
}

export function resolveMatchStatusLabel(
  status: MatchRow["status"],
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  return matchStatusLabels[status][locale];
}

export function formatMatchKickoffLabel(
  kickoffAt: string,
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  const formatted = new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: COT_TIME_ZONE,
  }).format(new Date(kickoffAt));

  return `${formatted} ${COT_TIME_ZONE_LABEL}`;
}

export function formatMatchDateTimeLabel(
  kickoffAt: string,
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  const formatted = new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: COT_TIME_ZONE,
  }).format(new Date(kickoffAt));

  return `${formatted} ${COT_TIME_ZONE_LABEL}`;
}

export function formatVenueLabel(
  input: {
    venueName?: string | null;
    venueCity?: string | null;
  },
  locale: PublicLocale = ACTIVE_PUBLIC_LOCALE,
) {
  const pendingLabel =
    locale === "es" ? "Estadio pendiente de confirmación" : "Venue pending confirmation";
  const stadium = input.venueName?.trim();
  const city = input.venueCity?.trim();

  if (stadium && city) {
    return `${stadium}, ${city}`;
  }

  if (stadium) {
    return stadium;
  }

  if (city) {
    return city;
  }

  return pendingLabel;
}

export function formatProbability(value: number) {
  return `${value.toFixed(1)}%`;
}

export function getMarketGlossary(locale: PublicLocale = ACTIVE_PUBLIC_LOCALE) {
  if (locale === "en") {
    return marketGlossary.map((item) => ({
      ...item,
      description: item.description,
    }));
  }

  return marketGlossary;
}

export function resolvePremiumMarketLabel(label: string) {
  return premiumMarketLabels[label] ?? label;
}

export function resolvePremiumMarketSelection(selection: string) {
  return premiumMarketSelections[selection] ?? selection;
}
