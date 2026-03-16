/**
 * PII Detector — regex-based detection engine
 * All processing is in-browser; no data leaves the device.
 */

export type PiiType =
  | "EMAIL"
  | "PHONE"
  | "AADHAAR"
  | "PAN"
  | "PASSPORT"
  | "CREDIT_CARD"
  | "BANK_ACCOUNT"
  | "IP_ADDRESS"
  | "API_KEY"
  | "PASSWORD"
  | "NAME"
  | "LOCATION"
  | "SECRET_TOKEN";

export interface PiiEntity {
  type: PiiType;
  value: string;
  start: number;
  end: number;
  redacted: string;
}

export interface ScanResult {
  filename: string;
  originalText: string;
  entities: PiiEntity[];
  maskedText: string;
}

/** Regex patterns for each PII type */
const PATTERN_DEFS: Array<{ type: PiiType; source: string; flags: string }> = [
  {
    type: "EMAIL",
    source: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
    flags: "g",
  },
  {
    type: "PHONE",
    source:
      "(?:\\+?91[-.\\s]?)?[6-9]\\d{9}|\\+?[1-9]\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}",
    flags: "g",
  },
  {
    type: "AADHAAR",
    source: "\\b\\d{4}[\\s\\-]?\\d{4}[\\s\\-]?\\d{4}\\b",
    flags: "g",
  },
  {
    type: "PAN",
    source: "\\b[A-Z]{5}[0-9]{4}[A-Z]\\b",
    flags: "g",
  },
  {
    type: "PASSPORT",
    source: "\\b[A-Z][1-9][0-9]{6}\\b",
    flags: "g",
  },
  {
    type: "CREDIT_CARD",
    source: "\\b(?:\\d{4}[\\s\\-]?){3}\\d{4}\\b",
    flags: "g",
  },
  {
    type: "BANK_ACCOUNT",
    source: "\\b\\d{9,18}\\b",
    flags: "g",
  },
  {
    type: "IP_ADDRESS",
    source: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
    flags: "g",
  },
  {
    type: "API_KEY",
    source:
      "(?:api[_\\-]?key|sk-|pk-|token)[=:\\s][\"']?([A-Za-z0-9\\-_]{16,})[\"']?",
    flags: "gi",
  },
  {
    type: "PASSWORD",
    source: "(?:password|passwd|pwd)[=:\\s][\"']?(\\S{6,})[\"']?",
    flags: "gi",
  },
  {
    type: "SECRET_TOKEN",
    source: "(?:secret|token|auth)[=:\\s][\"']?([A-Za-z0-9+/=]{20,})[\"']?",
    flags: "gi",
  },
  {
    type: "LOCATION",
    source:
      "(?:address|located at|lives in|city|state|country|district|pincode|zip)[\\s:]+([A-Za-z\\s,]+)",
    flags: "gi",
  },
  {
    type: "NAME",
    source:
      "\\b([A-Z][a-z]{1,20}\\s[A-Z][a-z]{1,20}(?:\\s[A-Z][a-z]{1,20})?)\\b",
    flags: "g",
  },
];

/** Find all regex matches for a given pattern */
function findMatches(
  text: string,
  type: PiiType,
  source: string,
  flags: string,
): PiiEntity[] {
  const entities: PiiEntity[] = [];
  const regex = new RegExp(source, flags);

  let match = regex.exec(text);
  while (match !== null) {
    const value = match[0];
    if (value.length === 0) break; // Prevent infinite loop on zero-length matches
    entities.push({
      type,
      value,
      start: match.index,
      end: match.index + value.length,
      redacted: `[REDACTED:${type}]`,
    });
    match = regex.exec(text);
  }

  return entities;
}

/**
 * Remove overlapping entities — keep the longest match at each position.
 * Entities are sorted by start index; overlapping ones are dropped.
 */
function deduplicateEntities(entities: PiiEntity[]): PiiEntity[] {
  const sorted = [...entities].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });

  const result: PiiEntity[] = [];
  let lastEnd = -1;

  for (const entity of sorted) {
    if (entity.start >= lastEnd) {
      result.push(entity);
      lastEnd = entity.end;
    }
  }

  return result;
}

/**
 * Mask specific entities in text, replacing them with redacted labels.
 * @param typesToMask - if provided, only mask these types
 */
export function maskEntities(
  text: string,
  entities: PiiEntity[],
  typesToMask?: PiiType[],
): string {
  const toMask = typesToMask
    ? entities.filter((e) => typesToMask.includes(e.type))
    : entities;

  const sorted = [...toMask].sort((a, b) => b.start - a.start);

  let result = text;
  for (const entity of sorted) {
    result =
      result.slice(0, entity.start) +
      entity.redacted +
      result.slice(entity.end);
  }

  return result;
}

/**
 * Scan text for all PII types and return a structured result.
 */
export function scanText(text: string, filename = "input.txt"): ScanResult {
  let allEntities: PiiEntity[] = [];

  for (const { type, source, flags } of PATTERN_DEFS) {
    const matches = findMatches(text, type, source, flags);
    allEntities = allEntities.concat(matches);
  }

  const entities = deduplicateEntities(allEntities);
  const maskedText = maskEntities(text, entities);

  return {
    filename,
    originalText: text,
    entities,
    maskedText,
  };
}

/** Human-readable labels for each PII type */
export const PII_LABELS: Record<PiiType, string> = {
  EMAIL: "Email Address",
  PHONE: "Phone Number",
  AADHAAR: "Aadhaar Number",
  PAN: "PAN Number",
  PASSPORT: "Passport Number",
  CREDIT_CARD: "Credit Card",
  BANK_ACCOUNT: "Bank Account",
  IP_ADDRESS: "IP Address",
  API_KEY: "API Key",
  PASSWORD: "Password",
  NAME: "Name",
  LOCATION: "Location",
  SECRET_TOKEN: "Secret Token",
};

/** Color styles for highlighting each PII type in the dark theme */
export const PII_HIGHLIGHT_STYLES: Record<
  PiiType,
  { bg: string; text: string; badge: string }
> = {
  EMAIL: {
    bg: "oklch(0.28 0.12 240 / 0.85)",
    text: "oklch(0.82 0.12 240)",
    badge: "#3b82f6",
  },
  PHONE: {
    bg: "oklch(0.26 0.10 155 / 0.85)",
    text: "oklch(0.82 0.12 155)",
    badge: "#22c55e",
  },
  AADHAAR: {
    bg: "oklch(0.30 0.12 60 / 0.85)",
    text: "oklch(0.85 0.14 60)",
    badge: "#f97316",
  },
  PAN: {
    bg: "oklch(0.28 0.12 305 / 0.85)",
    text: "oklch(0.82 0.12 305)",
    badge: "#a855f7",
  },
  PASSPORT: {
    bg: "oklch(0.28 0.12 345 / 0.85)",
    text: "oklch(0.85 0.12 345)",
    badge: "#ec4899",
  },
  CREDIT_CARD: {
    bg: "oklch(0.28 0.14 25 / 0.85)",
    text: "oklch(0.85 0.14 25)",
    badge: "#ef4444",
  },
  BANK_ACCOUNT: {
    bg: "oklch(0.32 0.12 80 / 0.85)",
    text: "oklch(0.88 0.14 80)",
    badge: "#eab308",
  },
  IP_ADDRESS: {
    bg: "oklch(0.28 0.12 200 / 0.85)",
    text: "oklch(0.82 0.12 200)",
    badge: "#06b6d4",
  },
  API_KEY: {
    bg: "oklch(0.28 0.14 15 / 0.85)",
    text: "oklch(0.85 0.14 15)",
    badge: "#f43f5e",
  },
  PASSWORD: {
    bg: "oklch(0.25 0.16 25 / 0.85)",
    text: "oklch(0.88 0.16 25)",
    badge: "#dc2626",
  },
  SECRET_TOKEN: {
    bg: "oklch(0.28 0.12 285 / 0.85)",
    text: "oklch(0.82 0.12 285)",
    badge: "#8b5cf6",
  },
  LOCATION: {
    bg: "oklch(0.28 0.10 175 / 0.85)",
    text: "oklch(0.82 0.10 175)",
    badge: "#14b8a6",
  },
  NAME: {
    bg: "oklch(0.28 0.10 260 / 0.85)",
    text: "oklch(0.82 0.10 260)",
    badge: "#6366f1",
  },
};

export const ALL_PII_TYPES: PiiType[] = [
  "EMAIL",
  "PHONE",
  "AADHAAR",
  "PAN",
  "PASSPORT",
  "CREDIT_CARD",
  "BANK_ACCOUNT",
  "IP_ADDRESS",
  "API_KEY",
  "PASSWORD",
  "SECRET_TOKEN",
  "LOCATION",
  "NAME",
];
