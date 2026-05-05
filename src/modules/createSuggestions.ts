export const createSuggestions = (
  el: HTMLTextAreaElement | HTMLInputElement,
  keys: string[],
  keyPair: { [key: string]: string[] },
  onChange: (value: string) => void,
  config: {
    keyPairSeparator: string;
    /**
     * When true, treat the whole input value as the search query
     * (case-insensitive substring match). On selection, replace
     * the entire input value with the chosen key. Use this for
     * single-value inputs (e.g. CSS custom property values).
     */
    matchAnywhere?: boolean;
  }
) => {
  let _keys = keys;
  let _keyPair = keyPair;
  const autocomplete = document.createElement("div");
  autocomplete.id = `autocomplete-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

  autocomplete.setAttribute(
    "style",
    ` display: none;
        position: absolute;
        border: none;
        max-height: 150px;
        overflow-y: auto;
        z-index: 100000;
        width: auto;
        border-radius: 4px;
    box-shadow: 0px 12px 24px 8px rgba(0, 0, 0, 0.08),0px 8px 16px 4px rgba(0, 0, 0, 0.08),0px 4px 8px 2px rgba(0, 0, 0, 0.08),0px 2px 6px 0px rgba(0, 0, 0, 0.08),0px -0.5px 0.5px 0px rgba(0, 0, 0, 0.12) inset,0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.12) inset;
    box-sizing: border-box;
    background: #404040;
    color: white;
    font-size: calc(11.5/16 * 1rem);
        `.replace(/\n/g, "")
  );

  let activeIndex = -1; // To track the currently highlighted suggestion

  // Get the cursor position in the textarea
  function getCursorPosition(
    el: HTMLTextAreaElement | HTMLInputElement
  ) {
    const rect = el.getBoundingClientRect();
    const lineHeight = 22; // Approximate line height

    const inputVal = el.value.substring(
      0,
      el.selectionStart ?? 0
    );
    const lines = inputVal.split("\n");

    const cursorTop = rect.top + lines.length * lineHeight;
    const cursorLeft =
      rect.left + lines[lines.length - 1].length * 3; // Approximate character width
    return { top: cursorTop, left: cursorLeft };
  }

  // Update the dropdown's position
  function updateDropdownPosition() {
    const { top, left } = getCursorPosition(el);
    autocomplete.style.top = `${top}px`;
    autocomplete.style.left = `${left}px`;
  }

  // Render the dropdown suggestions
  function renderSuggestions(suggestions: string[]) {
    if (suggestions.length === 0) {
      autocomplete.style.display = "none";
      return;
    }

    autocomplete.innerHTML = suggestions
      .map(
        (suggestion, index) =>
          `<div class="suggestion ${
            index === activeIndex ? "active" : ""
          }" data-index="${index}">${suggestion}</div>`
      )
      .join("");

    autocomplete.style.display = "block";
  }

  // Handle input event on the textarea
  el.addEventListener("input", (_) => {
    if (config.matchAnywhere) {
      const query = el.value.trim();
      if (query.length === 0) {
        autocomplete.style.display = "none";
        return;
      }
      const lower = query.toLowerCase();
      const matching = _keys.filter((k) =>
        k.toLowerCase().includes(lower)
      );
      if (matching.length > 0) {
        activeIndex = -1;
        renderSuggestions(matching);
        updateDropdownPosition();
      } else {
        autocomplete.style.display = "none";
      }
      return;
    }
    const cursorPos = el.selectionStart ?? 0;
    const textUpToCursor = el.value.substring(0, cursorPos);

    // Detect if typing a value after a colon
    const valueMatch = textUpToCursor.match(
      /([\w-]+):\s*([\w-()]*)$/
    );
    if (valueMatch) {
      const property = valueMatch[1];
      const valueQuery = valueMatch[2];
      const matchingValues = _keyPair[property]?.filter(
        (val) => val.startsWith(valueQuery)
      );
      let variables: string[] = [];

      if (
        valueQuery.startsWith("var") ||
        valueQuery.startsWith("--")
      ) {
        variables = (_keyPair["--variables"] || []).filter(
          (val) =>
            val.startsWith(
              valueQuery.startsWith("--")
                ? `var(${valueQuery}`
                : valueQuery
            )
        );
      }

      const finalSuggestions = [
        ...variables,
        ...matchingValues,
      ];

      if (finalSuggestions && finalSuggestions.length > 0) {
        activeIndex = -1;
        renderSuggestions(finalSuggestions);
        updateDropdownPosition();
        return;
      }
    }
    // Detect if typing a property
    const keyMatch = textUpToCursor.match(/([\w-]+)$/);
    if (keyMatch) {
      const query = keyMatch[1];
      const matchingProps = _keys.filter((prop) =>
        prop.startsWith(query)
      );

      if (matchingProps.length > 0) {
        activeIndex = -1;
        renderSuggestions(matchingProps);
        updateDropdownPosition();
        return;
      }
    }

    autocomplete.style.display = "none";
  });

  // Handle keyboard navigation and Enter key
  el.addEventListener("keydown", (event: any) => {
    const suggestions =
      autocomplete.querySelectorAll(".suggestion");

    if (
      autocomplete.style.display === "none" ||
      suggestions.length === 0
    ) {
      if (event.key === "Enter") {
        activeIndex = -1; // Reset active index
        return; // Allow default Enter behavior for a new line
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
      suggestions[activeIndex].scrollIntoView({
        block: "nearest",
      });

      renderSuggestions(
        Array.from(suggestions).map(
          (s) => s.textContent ?? ""
        )
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex =
        activeIndex === 0
          ? suggestions.length - 1
          : activeIndex - 1;

      suggestions[activeIndex].scrollIntoView({
        block: "nearest",
      });

      renderSuggestions(
        Array.from(suggestions).map(
          (s) => s.textContent ?? ""
        )
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) {
        const selectedSuggestion =
          suggestions[activeIndex].textContent ?? "";
        if (config.matchAnywhere) {
          el.value = selectedSuggestion;
          el.focus();
          el.setSelectionRange(
            selectedSuggestion.length,
            selectedSuggestion.length
          );
          onChange(el.value);
          autocomplete.style.display = "none";
          return;
        }
        const cursorPos = el.selectionStart ?? 0;
        const textUpToCursor = el.value.substring(
          0,
          cursorPos
        );

        // Handle value insertion
        const valueMatch = textUpToCursor.match(
          /([\w-]+):\s*([\w-()]*)$/
        );
        if (valueMatch) {
          const beforeCursor = textUpToCursor.substring(
            0,
            textUpToCursor.length - valueMatch[2].length
          );
          const afterCursor = el.value.substring(cursorPos);
          el.value = `${beforeCursor}${selectedSuggestion} ${afterCursor}`;
          el.focus();
          el.setSelectionRange(
            beforeCursor.length +
              selectedSuggestion.length +
              1,
            beforeCursor.length +
              selectedSuggestion.length +
              1
          );
          onChange(el.value);
        } else {
          // Handle property insertion
          const keyMatch =
            textUpToCursor.match(/([\w-]+)$/);
          if (keyMatch) {
            const beforeCursor = textUpToCursor.substring(
              0,
              textUpToCursor.length - keyMatch[1].length
            );
            const afterCursor =
              el.value.substring(cursorPos);
            el.value = `${beforeCursor}${selectedSuggestion}${config.keyPairSeparator} ${afterCursor}`;
            el.focus();
            el.setSelectionRange(
              beforeCursor.length +
                selectedSuggestion.length +
                2,
              beforeCursor.length +
                selectedSuggestion.length +
                2
            );
            onChange(el.value);
          }
        }

        autocomplete.style.display = "none";
      } else {
        // Allow Enter to create a new line
        activeIndex = -1;
        return;
      }
    } else if (event.key === "Escape") {
      el.focus();
      autocomplete.style.display = "none";
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Handle click on suggestions
  autocomplete.addEventListener("click", (event: any) => {
    if (event.target!.classList!.contains("suggestion")) {
      const selectedSuggestion = event.target!.textContent;
      if (config.matchAnywhere) {
        el.value = selectedSuggestion;
        el.focus();
        el.setSelectionRange(
          selectedSuggestion.length,
          selectedSuggestion.length
        );
        onChange(el.value);
        autocomplete.style.display = "none";
        return;
      }
      const cursorPos = el.selectionStart ?? 0;
      const textUpToCursor = el.value.substring(
        0,
        cursorPos
      );

      const valueMatch = textUpToCursor.match(
        /([\w-]+):\s*([\w-()]*)$/
      );

      if (valueMatch) {
        const beforeCursor = textUpToCursor.substring(
          0,
          textUpToCursor.length - valueMatch[2].length
        );
        const afterCursor = el.value.substring(cursorPos);
        el.value = `${beforeCursor}${selectedSuggestion} ${afterCursor}`;
        el.focus();
        el.setSelectionRange(
          beforeCursor.length +
            selectedSuggestion.length +
            1,
          beforeCursor.length +
            selectedSuggestion.length +
            1
        );
        onChange(el.value);
      } else {
        // Handle property insertion
        const keyMatch = textUpToCursor.match(/([\w-]+)$/);
        if (keyMatch) {
          const beforeCursor = textUpToCursor.substring(
            0,
            textUpToCursor.length - keyMatch[1].length
          );
          const afterCursor = el.value.substring(cursorPos);
          el.value = `${beforeCursor}${selectedSuggestion}${config.keyPairSeparator} ${afterCursor}`;
          el.focus();
          el.setSelectionRange(
            beforeCursor.length +
              selectedSuggestion.length +
              2,
            beforeCursor.length +
              selectedSuggestion.length +
              2
          );
          onChange(el.value);
        }
      }

      autocomplete.style.display = "none";
    }
  });

  // Hide autocomplete when clicking outside
  document.addEventListener("click", (event: any) => {
    if (
      !autocomplete.contains(event.target) &&
      event.target !== el
    ) {
      autocomplete.style.display = "none";
    }
  });

  document.body.appendChild(autocomplete);
  return {
    destroy: () => {
      autocomplete.remove();
    },
    autocompleteContainer: autocomplete,
    isVisible: () => {
      return autocomplete.style.display !== "none";
    },
    updateKeys: (
      keys: string[],
      keyPair: { [key: string]: string[] }
    ) => {
      _keys = keys;
      _keyPair = keyPair;
    },
  };
};
