import { CONSTANTS } from "../config/config";
import { debug } from "../modules/debug";
import { autoResizeTextarea } from "../utils/autoResizeTextarea";
import { setExtendedInputEnabled } from "../utils/extendedInputStore";
import { getExtendedInputEnabled } from "../utils/extendedInputStore";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { simulateNativeInput } from "../utils/simulateNativeInput";

//storing the prop creator element in memory
let _propCreator: HTMLElement | null = null;

let _isPropCreatorOpen = false;

//list of observers will be used to monitor the prop creator changes
const propCreatorListenerList = new Set<() => void>();

const injectExtendedInput = () => {
  propCreatorListenerList.forEach((listener) => {
    listener();
  });
  if (!_propCreator) {
    debug(
      "🙀 Prop Creator not found, skipping the process..."
    );
    return;
  }
  const propCreator = _propCreator;
  const propCreatorInput =
    propCreator.querySelector<HTMLInputElement>(
      CONSTANTS.PROP_EDITOR_INPUT_SELECTOR
    );
  if (propCreatorInput) {
    const parentElement = propCreatorInput.parentElement;
    makeElMutationChangeSafe(parentElement!);
    makeElMutationChangeSafe(propCreatorInput!);
    debug("✅ Prop Creator Input found");
    if (
      parentElement!.querySelector(
        "[ei-prop-creator-container]"
      )
    ) {
      return;
    }
    const textarea = document.createElement("textarea");
    makeElMutationChangeSafe(textarea);
    textarea.value = propCreatorInput.value;
    const onChange = () => {
      propCreatorInput.value = textarea.value;
      simulateNativeInput(propCreatorInput, textarea.value);
      autoResizeTextarea(textarea);
    };
    textarea.addEventListener("input", onChange);
    const reverseOnChange = () => {
      textarea.value = propCreatorInput.value;
    };
    propCreatorInput.addEventListener(
      "input",
      reverseOnChange
    );
    propCreatorListenerList.add(() => {
      textarea.removeEventListener("input", onChange);
      propCreatorInput.removeEventListener(
        "input",
        reverseOnChange
      );
    });
    textarea.style.cssText = propCreatorInput.style.cssText;
    textarea.style.display = propCreatorInput.style.display;
    textarea.style.overflow = "hidden";
    textarea.style.resize = "none";
    textarea.style.width = "100%";
    parentElement!.appendChild(textarea);
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "4px";
    container.style.gridColumn = "span 2";
    makeElMutationChangeSafe(container);
    container.setAttribute(
      "ei-prop-creator-container",
      "true"
    );
    const toggleCheckbox = document.createElement("div");
    makeElMutationChangeSafe(toggleCheckbox);
    toggleCheckbox.setAttribute(
      "style",
      "width: 12px; height: 12px; align-items: center; background: var(--colors-action-secondary-background); border-color: var(--colors-ui-checkbox-radio-border-color); border-radius: 2px; border-style: solid; border-width: 1px; box-sizing: border-box; display: flex; justify-content: center;"
    );
    toggleCheckbox.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 11" aria-hidden="true" data-icon="check-medium" class="bem-Svg" focusable="false" data-legacy-styled="true" width="13" height="11" style="display: none; position: relative; bottom: 0px;"><path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M11 2L5.5 8.5 2 5"></path></svg>`;
    const svg = toggleCheckbox.querySelector("svg");
    makeElMutationChangeSafe(svg!);
    const renderExtendedInput = () => {
      if (getExtendedInputEnabled()) {
        textarea.style.display = "block";
        propCreatorInput.style.display = "none";
        toggleCheckbox.style.backgroundColor =
          "var(--colors-action-primary-background)";
        toggleCheckbox.style.borderColor =
          "var(--colors-action-primary-background)";
        svg!.style.display = "block";
        autoResizeTextarea(textarea);
      } else {
        toggleCheckbox.style.backgroundColor =
          "var(--colors-action-secondary-background)";
        toggleCheckbox.style.borderColor =
          "var(--colors-ui-checkbox-radio-border-color)";
        svg!.style.display = "none";
        textarea.style.display = "none";
        propCreatorInput.style.display = "block";
      }
    };
    renderExtendedInput();
    container.addEventListener("mouseover", () => {
      svg!.style.display = "block";
    });
    container.addEventListener("mouseout", () => {
      if (getExtendedInputEnabled()) {
        svg!.style.display = "block";
      } else {
        svg!.style.display = "none";
      }
    });
    container.addEventListener("click", async () => {
      await setExtendedInputEnabled(
        !getExtendedInputEnabled()
      );
      renderExtendedInput();
    });
    const text = document.createElement("span");
    text.textContent = "Expand Input";
    text.style.fontSize = "12px";
    text.style.color = "var(--colors-text-secondary)";
    container.appendChild(toggleCheckbox);
    container.appendChild(text);
    parentElement!.appendChild(container);
  }
};

export //locate component property modal
const locatePropCreator = () => {
  const propCreator = document.querySelector(
    CONSTANTS.PROP_EDITOR_SELECTOR
  );
  _isPropCreatorOpen = propCreator !== null;
  if (propCreator && propCreator !== _propCreator) {
    debug(
      "✅ Prop Creator found, initializing the process..."
    );
    //store the prop creator element in memory
    _propCreator = propCreator as HTMLElement;
    //inject the extended input
    injectExtendedInput();
  }
};

export const isPropCreatorOpen = () => {
  return _isPropCreatorOpen;
};
