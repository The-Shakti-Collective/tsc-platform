/**
 * JS + checkJs: TanStack Query defaults mutation variables to `void`.
 * Loosen the default so destructured mutationFn args type-check in .js hooks.
 */
import type {
  QueryClient,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';

declare module '@tanstack/react-query' {
  export function useMutation<
    TData = unknown,
    TError = Error,
    TVariables = any,
    TContext = unknown,
  >(
    options: UseMutationOptions<TData, TError, TVariables, TContext>,
    queryClient?: QueryClient,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
}
