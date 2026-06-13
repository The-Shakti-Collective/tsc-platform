/** Normalize snapshot timestamps to UTC date-only (midnight). */
export function toSnapshotDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
