/** Canonical employee ID for identity comparisons and database parameters. */
export function normalizeStaffNo(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}
