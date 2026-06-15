/** Dev-only mock data — never default in production. */
export function shouldUseMockData(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}
