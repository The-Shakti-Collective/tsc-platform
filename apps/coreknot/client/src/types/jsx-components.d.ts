/**
 * checkJs infers component props from destructured parameters and rejects
 * React's special `key` prop at call sites. Mirror React 19 behaviour.
 */
import type { Key, ReactElement, ReactNode } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      key?: Key | null;
    }
  }
}

type ComponentProps<P extends Record<string, unknown>> = P & {
  key?: Key | null;
  children?: ReactNode;
};

declare module 'react' {
  interface FunctionComponent<P = Record<string, unknown>> {
    (props: ComponentProps<P>): ReactElement | null;
  }
}

export {};
