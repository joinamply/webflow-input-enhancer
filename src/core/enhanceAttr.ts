import { CONSTANTS } from "../config/config";
import { createSuggestions } from "../modules/createSuggestions";
import { debug } from "../modules/debug";
import { onVariablesChange } from "../modules/gellAllVariables";
import { onWebflowClassNameChange } from "../modules/getAllWebflowClassName";
import { autoResizeTextarea } from "../utils/autoResizeTextarea";
import {
  getExtendedAttrListEnabled,
  setExtendedAttrListEnabled,
} from "../utils/extendedAttrListStore";

import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { styleSuggestionMapKeys } from "../utils/styleSuggestionMap";
import { styleSuggestionMap } from "../utils/styleSuggestionMap";
import { isPropCreatorOpen } from "./locatePropCreator";

let _toDestroy: (() => void)[] = [];
let _globalDestroy: (() => void)[] = [];

//storing the prop creator element in memory
let _attrContainer: HTMLElement | null = null;
let _attrCustomContainer: HTMLElement | null = null;

const injectExtendedInput = (el: HTMLElement) => {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.marginTop = "4px";
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
  const text = document.createElement("span");
  text.textContent = "Expand Attributes List";
  text.style.fontSize = "12px";
  text.style.color = "var(--colors-text-secondary)";
  makeElMutationChangeSafe(svg!);

  const renderExtendedInput = () => {
    if (getExtendedAttrListEnabled()) {
      toggleCheckbox.style.backgroundColor =
        "var(--colors-action-primary-background)";
      toggleCheckbox.style.borderColor =
        "var(--colors-action-primary-background)";
      svg!.style.display = "block";
      el.setAttribute("ei-attr-list-enabled", "true");
    } else {
      toggleCheckbox.style.backgroundColor =
        "var(--colors-action-secondary-background)";
      toggleCheckbox.style.borderColor =
        "var(--colors-ui-checkbox-radio-border-color)";
      svg!.style.display = "none";
      el.removeAttribute("ei-attr-list-enabled");
    }
  };
  renderExtendedInput();
  container.addEventListener("mouseover", () => {
    svg!.style.display = "block";
  });
  container.addEventListener("mouseout", () => {
    if (getExtendedAttrListEnabled()) {
      svg!.style.display = "block";
    } else {
      svg!.style.display = "none";
    }
  });
  container.addEventListener("click", async () => {
    await setExtendedAttrListEnabled(
      !getExtendedAttrListEnabled()
    );
    renderExtendedInput();
  });
  container.appendChild(toggleCheckbox);
  container.appendChild(text);
  el.appendChild(container);
};

export //locate attribute
const locateAttrContainer = () => {
  const attrContainer = document.querySelector(
    CONSTANTS.ATTRIBUTE_CONTAINER_SELECTORS.normal
  );
  const attrCustomContainer = document.querySelector(
    CONSTANTS.ATTRIBUTE_CONTAINER_SELECTORS.custom
  );

  if (attrContainer && attrContainer !== _attrContainer) {
    debug(
      "✅ Attribute Container found, initializing the process..."
    );
    //store the prop creator element in memory
    _attrContainer = attrContainer as HTMLElement;
    //inject the extended input
    injectExtendedInput(_attrContainer);
  }
  if (
    attrCustomContainer &&
    attrCustomContainer !== _attrCustomContainer
  ) {
    debug(
      "✅ Attribute Custom Container found, initializing the process..."
    );
    _attrCustomContainer =
      attrCustomContainer as HTMLElement;
    //inject the extended input
    injectExtendedInput(_attrCustomContainer);
  }
  initEnhanceAttrInput();
};

const initEnhanceAttrInput = () => {
  _toDestroy.forEach((destroy) => destroy());
  _toDestroy = [];
  _globalDestroy.forEach((destroy) => destroy());
  _globalDestroy = [];
  const attrInputContainers = document.querySelectorAll(
    CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.parent
  );
  if (attrInputContainers.length) {
    attrInputContainers.forEach((attrInputContainer) => {
      const nameContainer =
        attrInputContainer.querySelector(
          CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.name
        ) ||
        attrInputContainer.querySelector(
          CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR
            .nameAlternative
        );

      if (
        nameContainer &&
        nameContainer.textContent?.trim().toLowerCase() ===
          CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.nameInnerText.toLowerCase()
      ) {
        makeElMutationChangeSafe(nameContainer);
        const nameInput = (nameContainer.querySelector(
          CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.nameInput
        ) ||
          nameContainer.querySelector(
            CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR
              .nameInputAlternative
          )) as HTMLInputElement;

        if (nameInput) {
          makeElMutationChangeSafe(nameInput);
          const valueContainer =
            attrInputContainer.querySelector(
              CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.value
            ) ||
            attrInputContainer.querySelector(
              CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR
                .valueAlternative
            );
          if (
            valueContainer &&
            valueContainer.textContent
              ?.trim()
              .toLowerCase() ===
              CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR.valueInnerText.toLowerCase()
          ) {
            makeElMutationChangeSafe(valueContainer);
            const valueInput =
              (valueContainer.querySelector(
                CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR
                  .valueInput
              ) ||
                valueContainer.querySelector(
                  CONSTANTS.ATTRIBUTE_CREATOR_SELECTOR
                    .valueInputAlternative
                )) as HTMLInputElement;
            if (valueInput) {
              makeElMutationChangeSafe(valueInput);
              const checkInput = () => {
                _toDestroy.forEach((destroy) => destroy());
                if (nameInput.value === "class") {
                  let allWebflowClassName: string[] = [];

                  const textareaEl =
                    document.createElement("textarea");
                  makeElMutationChangeSafe(textareaEl);
                  const getValue = (value: string) => {
                    return value
                      .split(" ")
                      .map((v) => v.trim())
                      .filter((v) => v.length)
                      .join("\n");
                  };
                  const getFinalValue = (value: string) => {
                    return value
                      .split("\n")
                      .filter((d) => d.length)
                      .join(" ");
                  };

                  let _value = valueInput.value;

                  const updateValue = () => {
                    _value = (
                      valueInput as HTMLInputElement
                    ).value;
                  };

                  const changeValue = (value: string) => {
                    (valueInput as HTMLInputElement).value =
                      value;
                    (
                      valueInput as HTMLInputElement
                    ).dispatchEvent(
                      new Event("input", {
                        bubbles: true,
                      })
                    );
                    (
                      valueInput as HTMLInputElement
                    ).dispatchEvent(
                      new Event("change", {
                        bubbles: true,
                      })
                    );
                    updateValue();
                  };

                  const onChange = (e: any) => {
                    if (
                      e &&
                      typeof e !== "string" &&
                      "stopPropagation" in e
                    ) {
                      e.stopPropagation();
                    }
                    changeValue(
                      getFinalValue(textareaEl.value)
                    );
                    //auto resize the textarea
                    autoResizeTextarea(textareaEl);
                  };

                  const suggestion = createSuggestions(
                    textareaEl,
                    allWebflowClassName,
                    {},
                    onChange,
                    {
                      keyPairSeparator: "",
                    }
                  );

                  const unsubscribe =
                    onWebflowClassNameChange((classes) => {
                      allWebflowClassName = classes;
                      suggestion.updateKeys(
                        allWebflowClassName,
                        {}
                      );
                    });

                  const onInputElChange = () => {
                    if (isPropCreatorOpen()) {
                      return;
                    }
                    if (
                      valueInput.value !==
                      getFinalValue(textareaEl.value)
                    ) {
                      textareaEl.value = getValue(
                        valueInput.value
                      );
                    }

                    autoResizeTextarea(textareaEl);
                    setTimeout(() => {
                      textareaEl.focus();
                    }, 10);
                  };

                  const observer = new MutationObserver(
                    onInputElChange
                  );
                  observer.observe(valueInput, {
                    childList: true,
                    attributes: true,
                  });

                  textareaEl.value = getValue(_value);

                  valueInput.classList.forEach(
                    (className) => {
                      textareaEl.classList.add(className);
                    }
                  );
                  //set the style of the textarea
                  textareaEl.style.cssText =
                    valueInput.style.cssText;
                  textareaEl.style.display =
                    valueInput.style.display;
                  textareaEl.style.overflow = "hidden";
                  textareaEl.style.resize = "none";
                  textareaEl.style.width = "100%";
                  textareaEl.style.minHeight = "2rem";
                  //add the event listeners

                  //add the input event listener
                  textareaEl.addEventListener(
                    "input",
                    onChange
                  );

                  _toDestroy.push(() => {
                    unsubscribe();
                    suggestion.destroy();
                    observer.disconnect();
                    textareaEl.removeEventListener(
                      "input",
                      onChange
                    );
                  });
                  //auto resize the textarea
                  autoResizeTextarea(textareaEl);

                  makeElMutationChangeSafe(
                    valueInput.parentElement as HTMLElement
                  );

                  valueInput.parentElement?.appendChild(
                    textareaEl
                  );
                  valueInput.style.display = "none";
                  _toDestroy.push(() => {
                    valueInput.style.display = "block";
                    textareaEl.remove();
                  });
                } else if (nameInput.value === "style") {
                  const parentEl = valueInput.parentElement;
                  makeElMutationChangeSafe(parentEl!);
                  const textareaEl =
                    document.createElement("textarea");
                  makeElMutationChangeSafe(textareaEl);

                  const getValue = (value: string) => {
                    return value
                      .split(";")
                      .map((v) => v.trim())
                      .join("\n");
                  };
                  //get the final value
                  const getFinalValue = (value: string) => {
                    return value
                      .split("\n")
                      .map((v) => v.trim().replace(";", ""))
                      .join("; ");
                  };

                  parentEl?.appendChild(textareaEl);

                  let _value = valueInput.value;

                  const updateValue = () => {
                    _value = (
                      valueInput as HTMLInputElement
                    ).value;
                  };

                  const changeValue = (value: string) => {
                    (valueInput as HTMLInputElement).value =
                      value;
                    (
                      valueInput as HTMLInputElement
                    ).dispatchEvent(
                      new Event("input", {
                        bubbles: true,
                      })
                    );
                    (
                      valueInput as HTMLInputElement
                    ).dispatchEvent(
                      new Event("change", {
                        bubbles: true,
                      })
                    );
                    updateValue();
                  };

                  const onChange = (e: any) => {
                    if (
                      e &&
                      typeof e !== "string" &&
                      "stopPropagation" in e
                    ) {
                      e.stopPropagation();
                    }

                    changeValue(
                      getFinalValue(textareaEl.value)
                    );
                    //auto resize the textarea
                    autoResizeTextarea(textareaEl);
                  };

                  const suggestion = createSuggestions(
                    textareaEl,
                    styleSuggestionMapKeys,
                    styleSuggestionMap,
                    onChange,
                    {
                      keyPairSeparator: ":",
                    }
                  );

                  const unsubscribe = onVariablesChange(
                    (variables) => {
                      suggestion.updateKeys(
                        styleSuggestionMapKeys,
                        {
                          ...styleSuggestionMap,
                          "--variables": variables,
                        }
                      );
                    }
                  );

                  const onInputElChange = () => {
                    if (isPropCreatorOpen()) {
                      return;
                    }
                    if (
                      valueInput.value !==
                      getFinalValue(textareaEl.value)
                    ) {
                      textareaEl.value = getValue(
                        valueInput.value
                      );
                    }

                    autoResizeTextarea(textareaEl);
                    setTimeout(() => {
                      textareaEl.focus();
                    }, 10);
                  };

                  const observer = new MutationObserver(
                    onInputElChange
                  );
                  observer.observe(valueInput, {
                    childList: true,
                    attributes: true,
                  });

                  const destroy = () => {
                    textareaEl.removeEventListener(
                      "input",
                      onChange
                    );
                    textareaEl.remove();
                    suggestion.destroy();
                    observer.disconnect();
                    valueInput.style.display = "block";
                    unsubscribe();
                  };

                  textareaEl.value = getValue(_value);

                  //add the class names of the element to the textarea
                  valueInput.classList.forEach(
                    (className) => {
                      textareaEl.classList.add(className);
                    }
                  );
                  //set the style of the textarea
                  textareaEl.style.cssText =
                    valueInput.style.cssText;
                  textareaEl.style.display =
                    valueInput.style.display;
                  textareaEl.style.overflow = "hidden";
                  textareaEl.style.resize = "none";
                  textareaEl.style.width = "100%";
                  textareaEl.style.minHeight = "2rem";
                  valueInput.style.display = "none";
                  textareaEl.addEventListener(
                    "input",
                    onChange
                  );

                  _toDestroy.push(destroy);
                  autoResizeTextarea(textareaEl);
                  makeElMutationChangeSafe(
                    valueInput.parentElement as HTMLElement
                  );
                }
              };
              nameInput.addEventListener(
                "input",
                checkInput
              );

              _globalDestroy.push(() => {
                nameInput.removeEventListener(
                  "input",
                  checkInput
                );
              });

              checkInput();
            }
          }
        }
      }
    });
  }
};
