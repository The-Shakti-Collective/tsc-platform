import Typesense from 'typesense';
import { getTypesenseConfig, type TypesenseConfig } from './config.js';

export type TypesenseClient = InstanceType<typeof Typesense.Client>;

export function createTypesenseClient(config: TypesenseConfig): TypesenseClient {
  return new Typesense.Client({
    nodes: [
      {
        host: config.host,
        port: config.port,
        protocol: config.protocol,
      },
    ],
    apiKey: config.apiKey,
    connectionTimeoutSeconds: 10,
  });
}

export function getTypesenseClient(
  env: NodeJS.ProcessEnv = process.env,
): TypesenseClient | null {
  const config = getTypesenseConfig(env);
  if (!config) return null;
  return createTypesenseClient(config);
}
