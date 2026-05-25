/**
 * CNJ Number Utilities
 * Format: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digits total)
 */

/** Remove everything that is not a digit */
export function onlyDigits(text: string): string {
  return text.replace(/\D/g, "");
}

/** Normalize a CNJ to 20 digits only */
export function normalizeCNJ(cnj: string): string {
  return onlyDigits(cnj);
}

/**
 * Calculate the CNJ check digit (DV) using the algorithm from Resolução CNJ 65/2008.
 * The base number is 18 digits (NNNNNNN + AAAA + J + TR + OOOO) and produces a 2-digit DV.
 */
export function calcularDVCNJ(base18: string): string {
  const pesos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  const len = base18.length;
  for (let i = 0; i < len; i++) {
    const idx = len - 1 - i;
    soma += parseInt(base18[idx], 10) * pesos[i];
  }
  const resto = soma % 11;
  if (resto === 10) return "0";
  if (resto === 11) return "1";
  return String(resto).padStart(2, "0");
}

/**
 * Full CNJ validation including check-digit verification per Resolução CNJ 65/2008.
 * Validates format (20 digits) and verifies the DV matches the calculated value.
 */
export function isValidCNJBasic(cnj: string): boolean {
  const digits = onlyDigits(cnj);
  if (digits.length !== 20) return false;

  const base18 = digits.slice(0, 7) + digits.slice(9, 20);
  const expectedDV = digits.slice(7, 9);
  return calcularDVCNJ(base18) === expectedDV;
}

/** Format 20-digit CNJ into standard mask: NNNNNNN-DD.AAAA.J.TR.OOOO */
export function formatCNJ(cnj: string): string {
  const d = onlyDigits(cnj);
  if (d.length !== 20) return cnj; // fallback — return as-is
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
}

/**
 * Extract valid CNJ numbers from arbitrary text.
 * Accepts:
 * - one CNJ per line
 * - CNJs separated by comma or semicolon
 * - CNJs pasted in running text
 * - CNJ with mask (0000000-00.0000.0.00.0000) or without (20 digits)
 * 
 * Returns array of unique 20-digit strings (no mask).
 */
export function extractCNJsFromText(text: string): string[] {
  const results = new Set<string>();

  // Strategy 1: try to match masked CNJ pattern first
  // NNNNNNN-DD.AAAA.J.TR.OOOO
  const maskedPattern = /\d{7}[\-\.]?\d{2}[\.\-]?\d{4}[\.\-]?\d[\.\-]?\d{2}[\.\-]?\d{4}/g;
  const maskedMatches = text.match(maskedPattern) || [];
  for (const match of maskedMatches) {
    const digits = onlyDigits(match);
    if (digits.length === 20) {
      results.add(digits);
    }
  }

  // Strategy 2: split by common separators and check for 20-digit tokens
  const normalizedText = text.replace(/[\n\r,;|]/g, " ");
  const tokens = normalizedText.split(/\s+/);
  for (const token of tokens) {
    const digits = onlyDigits(token);
    if (digits.length === 20) {
      results.add(digits);
    }
  }

  return Array.from(results);
}

/**
 * Parse and validate a list of raw CNJ strings.
 * Returns an object with valid CNJs (normalized), invalid entries, and duplicate count.
 */
export function parseCNJList(rawList: string[]): {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
} {
  const valid = new Set<string>();
  const invalid: string[] = [];
  let totalValid = 0;

  for (const raw of rawList) {
    const normalized = normalizeCNJ(raw);
    if (isValidCNJBasic(normalized)) {
      valid.add(normalized);
      totalValid++;
    } else if (raw.trim().length > 0) {
      invalid.push(raw.trim());
    }
  }

  return {
    valid: Array.from(valid),
    invalid,
    duplicatesRemoved: totalValid - valid.size,
  };
}
