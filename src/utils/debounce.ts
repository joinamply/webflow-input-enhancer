export function debounce<
  T extends (...args: any[]) => void
>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: any;

  return function (
    this: any,
    ...args: Parameters<T>
  ): void {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this as any, args);
    }, delay);
  };
}
