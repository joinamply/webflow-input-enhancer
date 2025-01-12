import { CONSTANTS } from "../config/config";

export function findAllParentElements(el: HTMLElement) {
  // Select all elements with the attribute `data-automation-id`.
  const allElements = el.querySelectorAll(
    "[data-automation-id]"
  );

  // Filter elements where `data-automation-id` matches the required patterns.
  return Array.from(allElements).filter((el) => {
    const attrValue = el.getAttribute("data-automation-id");
    if (attrValue) {
      if (
        attrValue ===
        CONSTANTS.PARENT_MATCHING_ELEMENTS_SELECTOR.parent
      ) {
        return false;
      }
      return (
        attrValue.startsWith(
          CONSTANTS.PARENT_MATCHING_ELEMENTS_SELECTOR.parent
        ) ||
        attrValue.startsWith(
          CONSTANTS.PARENT_MATCHING_ELEMENTS_SELECTOR
            .separator
        )
      );
    }
    return false;
  });
}
