import type { PrismaClient } from "@tsc/database/client";
import type { CityIntelligenceMetrics } from "../industry/types.js";
import { toSnapshotDateOnly } from "./persist.js";

export interface PersistCityIntelligenceSnapshotOptions {
  prisma: PrismaClient;
  city: string;
  metrics: CityIntelligenceMetrics;
  snapshotDate: Date;
  id?: string;
}

/** Stub — CityIntelligenceSnapshot model wiring deferred to Stage 2. */
export async function createCityIntelligenceSnapshot(
  options: PersistCityIntelligenceSnapshotOptions,
): Promise<{ city: string; metrics: CityIntelligenceMetrics; snapshotDate: Date }> {
  void options.prisma;
  void options.id;
  return {
    city: options.city,
    metrics: options.metrics,
    snapshotDate: toSnapshotDateOnly(options.snapshotDate),
  };
}
