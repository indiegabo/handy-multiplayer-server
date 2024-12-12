export class Delay {
  public static for = (ms: number) => new Promise<void>(res => setTimeout(res, ms));
}

export interface CancelableDelay<T> extends Promise<T> {
  cancel: () => void;
}
