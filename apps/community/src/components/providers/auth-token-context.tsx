'use client';

import { createContext } from 'react';

export type AuthTokenGetter = () => Promise<string | null>;

export const AuthTokenContext = createContext<AuthTokenGetter>(() => Promise.resolve(null));
