import axios, { AxiosHeaders } from 'axios';
import { apiPath, getAxiosBaseURL } from '../utils/apiBase';

/** @type {(() => Promise<string | null>) | null} */
let tokenGetter = null;

export function setApiTokenGetter(getter) {
  tokenGetter = getter;
}

export function getTscApiBase() {
  const tsc = (import.meta.env.VITE_TSC_API_URL || '').trim().replace(/\/$/, '');
  if (tsc) return tsc;
  const origin = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (origin && import.meta.env.PROD) return `${origin}/api`;
  return '';
}

/** Build absolute or proxied `/api/...` URL without double `/api` prefix. */
export function resolveApiPath(modulePrefix, segment = '') {
  const seg = segment.startsWith('/') ? segment : segment ? `/${segment}` : '';
  const path = modulePrefix.startsWith('/api/')
    ? `${modulePrefix}${seg}`
    : `/api/${modulePrefix.replace(/^\//, '')}${seg}`;

  const base = getTscApiBase();
  if (base) {
    const suffix = path.startsWith('/api') ? path.slice(4) : path;
    return `${base}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
  }
  return apiPath(path);
}

const http = axios.create({
  baseURL: getAxiosBaseURL(),
  timeout: 15000,
  withCredentials: true,
});

http.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return config;
});

function unwrap(data) {
  const payload = data?.data ?? data;
  if (payload == null || (typeof payload !== 'object' && typeof payload !== 'string')) {
    throw new Error('Empty API response');
  }
  return payload;
}

export async function apiGet(url, config) {
  const { data } = await http.get(url, config);
  return unwrap(data);
}

export async function apiPost(url, body, config) {
  const { data } = await http.post(url, body, config);
  return unwrap(data);
}

export async function apiPatch(url, body, config) {
  const { data } = await http.patch(url, body, config);
  return unwrap(data);
}

export async function apiDelete(url, config) {
  const { data } = await http.delete(url, config);
  return unwrap(data);
}

export async function apiPut(url, body, config) {
  const { data } = await http.put(url, body, config);
  return unwrap(data);
}

/** @deprecated Use apiGet/apiPost — kept for App health probe wiring. */
export function createAuthenticatedFetch(getToken) {
  return async (path, init = {}) => {
    const token = await getToken();
    const headers = new Headers(init.headers ?? {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const url = resolveApiPath('/api', path.startsWith('/') ? path : `/${path}`);
    return fetch(url, { ...init, headers, credentials: 'include' });
  };
}

export { http as apiHttp };
