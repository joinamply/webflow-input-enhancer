export function findElementWithAttributeValue(
  element: HTMLElement | null,
  attribute: string,
  value: string,
  maxLevels: number = 10
): boolean {
  let current: HTMLElement | null = element;
  let level = 0;

  while (current && level < maxLevels) {
    if (
      current.hasAttribute(attribute) &&
      current.getAttribute(attribute) === value
    ) {
      return true; // Found the element with the matching attribute and value
    }
    current = current.parentElement; // Move to the parent
    level++;
  }

  return false; // Attribute with matching value not found within max levels
}
