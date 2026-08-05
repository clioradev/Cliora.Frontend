import { DestroyRef, Injector, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface AsyncActionOptions<TResult, TArgs extends unknown[]> {
  onSuccess?: (value: TResult, ...args: TArgs) => void;
  onError?: (err: unknown, ...args: TArgs) => void;
  /** Guard de negocio adicional al anti-doble-click, que ya está cubierto internamente. */
  canRun?: (...args: TArgs) => boolean;
  resolveErrorMessage?: (err: unknown) => string;
  defaultErrorMessage?: string;
  injector?: Injector;
}

export interface AsyncAction<TArgs extends unknown[]> {
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly success: Signal<boolean>;
  run(...args: TArgs): void;
  reset(): void;
}

export function asyncAction<TResult, TArgs extends unknown[]>(
  action: (...args: TArgs) => Observable<TResult>,
  options: AsyncActionOptions<TResult, TArgs> = {},
): AsyncAction<TArgs> {
  const destroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const success = signal(false);

  function run(...args: TArgs): void {
    if (loading() || options.canRun?.(...args) === false) {
      return;
    }
    loading.set(true);
    error.set(null);
    success.set(false);

    action(...args)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (value) => {
          loading.set(false);
          success.set(true);
          options.onSuccess?.(value, ...args);
        },
        error: (err: unknown) => {
          loading.set(false);
          error.set(resolveErrorMessage(err, options));
          options.onError?.(err, ...args);
        },
      });
  }

  function reset(): void {
    error.set(null);
    success.set(false);
  }

  return { loading, error, success, run, reset };
}

function resolveErrorMessage<TResult, TArgs extends unknown[]>(
  err: unknown,
  options: AsyncActionOptions<TResult, TArgs>,
): string {
  if (options.resolveErrorMessage) {
    return options.resolveErrorMessage(err);
  }
  const body = (err as { error?: unknown } | null)?.error;
  if (Array.isArray(body) && body.every((m) => typeof m === 'string')) {
    return body.join(' ');
  }
  return options.defaultErrorMessage ?? 'Se ha producido un error. Inténtalo de nuevo.';
}
