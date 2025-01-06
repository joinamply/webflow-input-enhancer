// Copy computed styles from the input to the textarea
export const copyStyles = (
  source: HTMLElement,
  target: HTMLElement
) => {
  const computedStyle = window.getComputedStyle(source);
  for (const key of computedStyle) {
    (target.style as any)[key] =
      computedStyle.getPropertyValue(key);
  }
};
