type DebouncedFunction<F extends (...args: any[]) => any> =
  (...args: Parameters<F>) => Promise<ReturnType<F>>;

/**
 * Creates a debounced version of a function.
 * @param fn - The function to debounce.
 * @param debounceTime - The debounce time in milliseconds.
 * @param maxCalls - The maximum number of allowed calls before debounce is applied.
 * @param resetTimeout - The time (in milliseconds) after which the call count resets.
 * @returns A debounced version of the input function.
 */
export function ratedDebounce<
  F extends (...args: any[]) => any
>(
  fn: F,
  debounceTime: number = 100,
  maxCalls: number = 10,
  resetTimeout: number = 1000
): DebouncedFunction<F> {
  let callCount = 0;
  let timeoutId: number | null = null;
  let isDebouncing = false;

  // Reset the call count and debounce state after the resetTimeout
  setInterval(() => {
    callCount = 0;
    isDebouncing = false;
  }, resetTimeout);

  return async function (
    ...args: Parameters<F>
  ): Promise<ReturnType<F>> {
    // Increment the call count
    callCount++;

    // Apply debounce if call count exceeds maxCalls
    if (callCount > maxCalls) {
      isDebouncing = true;
    }

    // If debouncing, delay the function execution
    if (isDebouncing) {
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear the previous debounce timer
      }

      return new Promise<ReturnType<F>>((resolve) => {
        timeoutId = setTimeout(async () => {
          resolve(fn(...args));
        }, debounceTime);
      });
    }

    // If not debouncing, execute the function immediately
    return fn(...args);
  };
}
