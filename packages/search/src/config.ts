export type TypesenseConfig = {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;
};

export function getTypesenseConfig(
  env: NodeJS.ProcessEnv = process.env,
): TypesenseConfig | null {
  const host = env.TYPESENSE_HOST?.trim();
  const apiKey = env.TYPESENSE_API_KEY?.trim();
  if (!host || !apiKey) return null;

  const protocol = env.TYPESENSE_PROTOCOL?.trim() === 'http' ? 'http' : 'https';
  const port = Number.parseInt(env.TYPESENSE_PORT?.trim() ?? '443', 10);

  return {
    host,
    port: Number.isFinite(port) ? port : 443,
    protocol,
    apiKey,
  };
}

export function isTypesenseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return getTypesenseConfig(env) !== null;
}
