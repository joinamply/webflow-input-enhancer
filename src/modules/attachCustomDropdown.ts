import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

type Option = { key: string; value: string };

type DropdownUtils = {
  destroy: () => void;
  setValue: (value: string | null) => void;
  getSelectedValue: () => string | null;
  onChange: (
    callback: (selected: Option | null) => void
  ) => void;
};

const closeSVG = `<svg data-wf-icon="CloseCircleIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.79287 7.50004L5.64642 9.64648L6.35353 10.3536L8.49998 8.20714L10.6464 10.3536L11.3535 9.64648L9.20708 7.50004L11.3535 5.35359L10.6464 4.64648L8.49998 6.79293L6.35353 4.64648L5.64642 5.35359L7.79287 7.50004Z" fill="currentColor"></path><path opacity="0.4" fill-rule="evenodd" clip-rule="evenodd" d="M8.5 2C5.46243 2 3 4.46243 3 7.5C3 10.5376 5.46243 13 8.5 13C11.5376 13 14 10.5376 14 7.5C14 4.46243 11.5376 2 8.5 2ZM2 7.5C2 3.91015 4.91015 1 8.5 1C12.0899 1 15 3.91015 15 7.5C15 11.0899 12.0899 14 8.5 14C4.91015 14 2 11.0899 2 7.5Z" fill="currentColor"></path></svg>`;

const selectedIconSVG = `<svg data-wf-icon="CheckDefaultIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.3536 4.35355L6.85377 10.8541C6.76 10.9479 6.63281 11.0006 6.5002 11.0006C6.36758 11.0006 6.24039 10.9479 6.14662 10.8541L2.64648 7.35355L3.35363 6.64649L6.5002 9.79342L12.6465 3.64648L13.3536 4.35355Z" fill="currentColor"></path></svg>`;

function attachCustomDropdown(
  targetElement: HTMLElement,
  options: Option[],
  defaultValue: string | null
): DropdownUtils {
  let selectedValue: string | null = defaultValue;
  let onChangeCallback: (
    selected: Option | null
  ) => void = () => {};
  let activeIndex = -1;

  const dropdownContainer = document.createElement("div");
  makeElMutationChangeSafe(dropdownContainer);
  dropdownContainer.style.position = "relative";
  dropdownContainer.style.display = "flex";

  dropdownContainer.style.color = "#fff";
  dropdownContainer.style.backgroundColor = "#333";
  dropdownContainer.style.alignItems = "center";
  dropdownContainer.style.borderRadius = "4px";
  dropdownContainer.style.boxShadow =
    "var(--box-shadows-ui-select)";
  dropdownContainer.style.cursor = "default";
  dropdownContainer.style.display = "flex";
  dropdownContainer.style.justifyContent = "space-between";
  dropdownContainer.style.minHeight = "24px";
  dropdownContainer.style.position = "relative";
  dropdownContainer.style.transition = "none";
  dropdownContainer.style.boxSizing = "border-box";
  dropdownContainer.style.background =
    "var(--colors-ui-select-background)";
  dropdownContainer.style.border =
    "1px solid var(--colors-ui-select-border)";
  dropdownContainer.style.color =
    "var(--colors-text-primary)";
  dropdownContainer.style.outlineOffset = "1px";
  dropdownContainer.style.padding =
    "var(--wf-system---ui-select-control-padding)";
  dropdownContainer.style.outlineColor =
    "var(--colors-blue-border) !important";
  dropdownContainer.style.outlineStyle = "solid !important";
  dropdownContainer.style.outlineWidth = "0px !important";
  const removeError = () => {
    dropdownContainer.style.boxShadow =
      "var(--box-shadows-ui-select)";
  };
  const addError = () => {
    dropdownContainer.style.boxShadow =
      "var(--box-shadows-ui-select), var(--wf-designer--inputOutlineFocusError)";
  };
  const inputField = document.createElement("input");
  makeElMutationChangeSafe(inputField);
  inputField.type = "text";
  inputField.placeholder = "Search options...";
  inputField.value =
    options.find((opt) => opt.value === defaultValue)
      ?.key || "";
  inputField.style.cursor = "pointer";
  inputField.style.color = "#fff";
  inputField.style.backgroundColor = "transparent";
  inputField.style.outline = "none";
  inputField.style.border = "none";
  inputField.style.padding = "0px";
  inputField.style.margin = "0px";
  inputField.style.fontSize = "inherit";
  inputField.style.flex = "1";
  const clearButtonContainer =
    document.createElement("div");
  makeElMutationChangeSafe(clearButtonContainer);
  clearButtonContainer.style.color =
    "var(--component-icon-color, currentColor)";
  clearButtonContainer.style.flex = "0 0 auto";
  clearButtonContainer.style.opacity =
    "var(--opacities-default)";
  clearButtonContainer.style.display = "flex";
  clearButtonContainer.style.alignItems = "center";
  clearButtonContainer.style.justifyContent = "center";
  const clearButton = document.createElement("span");
  makeElMutationChangeSafe(clearButton);
  clearButton.innerHTML = closeSVG;
  clearButton.style.cursor = "pointer";
  clearButton.style.marginLeft = "2px";
  clearButton.style.color = "#fff";
  clearButton.style.display = selectedValue
    ? "flex"
    : "none";
  clearButton.style.alignItems = "center";
  clearButton.style.justifyContent = "center";
  clearButton.addEventListener("click", () => {
    selectedValue = null;
    inputField.value = "";
    removeError();
    clearButton.style.display = "none";
    updateActiveOption(-1);
    onChangeCallback(null);
  });

  clearButtonContainer.appendChild(clearButton);
  const dropdownList = document.createElement("ul");
  makeElMutationChangeSafe(dropdownList);
  dropdownList.style.position = "absolute";
  dropdownList.style.top = "calc(100% + 3px)";
  dropdownList.style.left = "0px";
  dropdownList.style.borderRadius = "4px";
  dropdownList.style.boxShadow = "var(--box-shadows-menu)";
  dropdownList.style.marginBottom = "8px";
  dropdownList.style.marginTop = "4px";
  dropdownList.style.width = "100%";
  dropdownList.style.zIndex = "1";
  dropdownList.style.boxSizing = "border-box";
  dropdownList.style.background =
    "var(--colors-ui-menu-content-background)";
  dropdownList.style.fontSize =
    "var(--wf-system---typography-font-size-body)";
  dropdownList.style.listStyle = "none";
  dropdownList.style.padding = "0";
  dropdownList.style.margin = "0";
  dropdownList.style.display = "none";

  const renderOptions = () => {
    dropdownList.replaceChildren();

    options.forEach((option, index) => {
      const optionItem = document.createElement("li");
      makeElMutationChangeSafe(optionItem);
      optionItem.addEventListener("mouseenter", () => {
        optionItem.style.backgroundColor =
          "var(--colors-ui-background-hover)"; // Add hover effect
      });

      optionItem.addEventListener("mouseleave", () => {
        if (index !== activeIndex) {
          optionItem.style.backgroundColor = ""; // Reset background color if not active
        }
      });
      optionItem.style.color = "var(--colors-text-primary)";
      optionItem.style.cursor = "default";
      optionItem.style.display = "flex";
      optionItem.style.alignItems = "center";
      optionItem.style.fontSize = "inherit";
      optionItem.style.padding =
        "var(--wf-system---ui-select-option-padding)";
      optionItem.style.width = "100%";
      optionItem.style.userSelect = "none";

      optionItem.style.boxSizing = "border-box";
      optionItem.style.overflow = "hidden";
      optionItem.style.textOverflow = "ellipsis";
      optionItem.style.whiteSpace = "nowrap";
      optionItem.style.opacity = "1";

      const addSelectedIcon = () => {
        const isSelected = option.value === selectedValue;

        optionItem.replaceChildren();

        if (isSelected) {
          const existingIcon = targetElement.querySelector(
            "[data-icon-selected='true']"
          );
          if (existingIcon) {
            existingIcon.remove();
          }
          optionItem.style.backgroundColor =
            "var(--colors-ui-background-hover)";

          const iconContainer =
            document.createElement("div");

          makeElMutationChangeSafe(iconContainer);
          iconContainer.setAttribute(
            "data-icon-selected",
            "true"
          );
          iconContainer.setAttribute("aria-hidden", "true");
          iconContainer.style.width = "16px";
          iconContainer.style.height = "16px";
          iconContainer.style.display = "inline-block";
          iconContainer.style.marginRight = "2px";
          iconContainer.innerHTML = selectedIconSVG;

          optionItem.appendChild(iconContainer);
          const textNode = document.createTextNode(
            option.key
          );
          optionItem.appendChild(textNode);
        } else {
          optionItem.textContent = option.key;
        }
      };
      addSelectedIcon();

      optionItem.setAttribute("data-value", option.value);
      optionItem.setAttribute("data-key", option.key);

      optionItem.addEventListener("click", () => {
        selectedValue = option.value;
        inputField.value = option.key;
        removeError();
        clearButton.style.display = "flex";
        dropdownList.style.display = "none";
        onChangeCallback(option);
        updateActiveOption(index);
        addSelectedIcon();
      });

      dropdownList.appendChild(optionItem);
    });
  };

  renderOptions();

  const updateActiveOption = (newIndex: number) => {
    activeIndex = newIndex;
    Array.from(dropdownList.children).forEach(
      (child, index) => {
        const optionElement = child as HTMLElement;
        const isActive = index === activeIndex;

        // Update background color for active state
        optionElement.style.backgroundColor = isActive
          ? "var(--colors-ui-background-hover)"
          : "var(--colors-ui-menu-content-background)";
      }
    );
  };

  inputField.addEventListener("focus", () => {
    dropdownList.style.display = "block";
    //updateActiveOption(-1);
  });

  inputField.addEventListener("input", () => {
    const enteredValue = inputField.value.toLowerCase();
    const matchingOptionIndex = options.findIndex((opt) =>
      opt.key.toLowerCase().includes(enteredValue)
    );

    if (matchingOptionIndex >= 0) {
      // selectedValue = options[matchingOptionIndex].value;
      updateActiveOption(matchingOptionIndex);
      removeError();
    } else {
      selectedValue = null;
      removeError(); // Remove error during input
    }

    dropdownList.style.display = "block";
  });

  inputField.addEventListener("blur", () => {
    const enteredValue = inputField.value.toLowerCase();
    const matchingOption = options.find(
      (opt) => opt.key.toLowerCase() === enteredValue
    );

    if (!matchingOption && enteredValue.length > 0) {
      addError();
    } else {
      removeError();
    }
    if (enteredValue.length === 0 && selectedValue) {
      const option = options.find(
        (opt) => opt.value === selectedValue
      );

      if (option) {
        inputField.value = option.key;
      }
    }
  });

  inputField.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      dropdownList.style.display = "block";
      if (activeIndex < options.length - 1) {
        updateActiveOption(activeIndex + 1);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      dropdownList.style.display = "block";
      if (activeIndex > 0) {
        updateActiveOption(activeIndex - 1);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) {
        const selectedOption = options[activeIndex];
        selectedValue = selectedOption.value;
        inputField.value = selectedOption.key;
        removeError();
        clearButton.style.display = "flex";
        dropdownList.style.display = "none";
        onChangeCallback(selectedOption);
        updateActiveOption(activeIndex);
        inputField.blur();
        renderOptions();
      }
    } else if (event.key === "Escape") {
      dropdownList.style.display = "none";
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdownContainer.contains(event.target as Node)) {
      dropdownList.style.display = "none";
    }
  });

  dropdownContainer.appendChild(inputField);
  dropdownContainer.appendChild(clearButtonContainer);
  dropdownContainer.appendChild(dropdownList);
  targetElement.appendChild(dropdownContainer);

  return {
    destroy: () => {
      targetElement.removeChild(dropdownContainer);
    },
    setValue: (value: string | null) => {
      const option = options.find(
        (opt) => opt.value === value
      );
      selectedValue = option ? option.value : null;
      inputField.value = option ? option.key : "";
      clearButton.style.display = option ? "flex" : "none";
      if (option) {
        removeError();
      } else {
        if (value !== null && value.length > 0) {
          addError();
        }
      }
      updateActiveOption(
        options.findIndex(
          (opt) => opt.value === selectedValue
        )
      );
      renderOptions();
    },
    getSelectedValue: () => selectedValue,
    onChange: (
      callback: (selected: Option | null) => void
    ) => {
      onChangeCallback = callback;
    },
  };
}

export default attachCustomDropdown;
