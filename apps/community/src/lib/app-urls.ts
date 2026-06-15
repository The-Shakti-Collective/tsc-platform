/** External URLs that must include basePath when linking out of the app shell. */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}

export function getWebsiteUrl(): string {
  return (process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'https://theshakticollective.in').replace(
    /\/$/,
    '',
  );
}

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';
  return `${getWebsiteUrl()}${basePath}`;
}
