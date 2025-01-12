import { CONSTANTS } from "../config/config";
import { findElementWithAttributeValue } from "./findElementWithAttributeValue";

export function safeMutationRecordCheck(m: MutationRecord) {
  return (
    ("ieType" in m.target && m.target.ieType === true) ||
    findElementWithAttributeValue(
      m.target as HTMLElement,
      "data-automation-id",
      "ExpressionEditor-fieldWrapper-Slot"
    ) ||
    findElementWithAttributeValue(
      m.target as HTMLElement,
      "ei-skip",
      "true"
    ) ||
    ((m.target as HTMLElement) &&
      CONSTANTS.safeAttrVals.includes(
        (m.target as HTMLElement).getAttribute(
          "data-automation-id"
        )!
      ))
  );
}
