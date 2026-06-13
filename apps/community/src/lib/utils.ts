import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl(): string {
  const url = (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_TSC_API_URL
  )?.trim();

  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL or NEXT_PUBLIC_TSC_API_URL is required');
  }

  return url.replace(/\/$/, '');
}

export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url) {
    throw new Error('NEXT_PUBLIC_APP_URL is required');
  }

  return url.replace(/\/$/, '');
}
