export interface CancellablePromise<T> {
  promise: Promise<T>;
  cancel: () => void;
}

export class Delay {

  /**
   * Returns a cancellable promise that resolves after the given time in milliseconds.
   * The promise is cancellable through the `cancel` function returned in the object.
   * @param ms The time in milliseconds to wait before resolving.
   * @returns A cancellable promise that resolves after the given time.
   */
  public static for(ms: number): CancellablePromise<void> {
    const controller = new AbortController();
    const signal = controller.signal;

    let timeoutId: NodeJS.Timeout;

    const promise = new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        resolve();
      }, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
    });

    promise.finally(() => clearTimeout(timeoutId));

    return { promise, cancel: () => controller.abort() };
  }
}