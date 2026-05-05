import { createSuggestions } from "./createSuggestions";
import { onVariablesChange } from "./gellAllVariables";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

const VALUE_INPUT_SELECTOR =
  '[data-automation-id^="expanded-css-properties-value-input-"]';
const ENHANCED_ATTR = "ei-style-custom-prop";

type Suggestion = ReturnType<typeof createSuggestions>;

const enhancements = new Map<
  HTMLInputElement,
  { destroy: () => void; suggestion: Suggestion }
>();

let allVariables: string[] = [];
let varsListenerAttached = false;

const ensureVarsListener = () => {
  if (varsListenerAttached) return;
  varsListenerAttached = true;
  onVariablesChange((vars) => {
    allVariables = vars;
    enhancements.forEach((entry) => {
      entry.suggestion.updateKeys(vars, {});
    });
  });
};

const enhanceInput = (input: HTMLInputElement) => {
  if (enhancements.has(input)) return;
  if (input.hasAttribute(ENHANCED_ATTR)) return;
  input.setAttribute(ENHANCED_ATTR, "true");
  makeElMutationChangeSafe(input);

  const onChange = (value: string) => {
    input.value = value;
    input.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    input.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  };

  const suggestion = createSuggestions(
    input,
    allVariables,
    {},
    onChange,
    { keyPairSeparator: "", matchAnywhere: true }
  );

  const destroy = () => {
    suggestion.destroy();
    input.removeAttribute(ENHANCED_ATTR);
    enhancements.delete(input);
  };

  enhancements.set(input, { destroy, suggestion });
};

export const enhanceStyleCustomProps = () => {
  ensureVarsListener();

  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      VALUE_INPUT_SELECTOR
    )
  );

  inputs.forEach(enhanceInput);

  // Tear down enhancements for inputs that have been removed from
  // the DOM (e.g. a custom property row was deleted).
  enhancements.forEach((entry, input) => {
    if (!document.contains(input)) {
      entry.destroy();
    }
  });
};
