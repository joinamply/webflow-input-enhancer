// Function to handle React-based input value updates
const changeValue = (el, value) => {
    const fiberKey = Object.keys(el).find((key) => key.startsWith("__reactFiber$") || key.startsWith("__reactProps$"));
    if (fiberKey) {
        const reactFiber = el[fiberKey];
        if (reactFiber?.memoizedProps?.onChange) {
            el.value = value;
            reactFiber.memoizedProps.onChange({
                target: { value },
                currentTarget: { value },
            });
        } else {
            console.error("React onChange not found in fiber.");
        }
    } else {
        simulateNativeInput(el, value);
    }
};

// Fallback to simulate native input events
const simulateNativeInput = (el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
};

// Function to auto-resize the textarea based on its content
const autoResizeTextarea = (textarea) => {
    textarea.style.height = "auto"; // Reset height to auto for recalculation
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scrollHeight
};

// Copy computed styles from the input to the textarea
const copyStyles = (source, target) => {
    const computedStyle = window.getComputedStyle(source);
    for (const key of computedStyle) {
        target.style[key] = computedStyle.getPropertyValue(key);
    }
};

// Handle Style and Class inputs by replacing them with a textarea
const enhanceInputWithTextarea = (input, type) => {
    const styleValue = input.value;

    if (styleValue) {
        // Determine formatting rules based on type
        const breakCharacter = type === "Style" ? ";" : " ";
        const joinCharacter = type === "Style" ? "; " : " ";

        // Format the value into multiple lines
        const formattedValue = styleValue
            .split(breakCharacter)
            .filter((entry) => entry.trim() !== "")
            .map((entry) => entry.trim())
            .join("\n");

        // Check if a textarea already exists below this input
        let existingTextarea = input.nextElementSibling;
        if (existingTextarea && existingTextarea.tagName === "TEXTAREA") {
            existingTextarea.focus();
            return;
        }

        // Create a textarea
        const textarea = document.createElement("textarea");
        textarea.value = formattedValue;

        // Copy styles from input to textarea
        copyStyles(input, textarea);
        textarea.style.marginTop = "8px"; // Add some spacing below the input
        textarea.style.whiteSpace = "pre-wrap";
        textarea.style.overflow = "hidden";
        textarea.style.resize = "none";
        textarea.style.border = "1px solid #367be8";

        // Insert the textarea below the input
        input.parentNode.insertBefore(textarea, input.nextSibling);

        // Auto-resize the textarea initially and on input
        autoResizeTextarea(textarea);
        textarea.addEventListener("input", () => {
            autoResizeTextarea(textarea);

            // Update the original input on every input event
            const updatedStyle = textarea.value
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "")
                .join(joinCharacter);

            changeValue(input, updatedStyle); // Dynamically update the input value
        });

        // Restore original input and remove textarea on blur
        textarea.addEventListener("blur", () => {
            const updatedStyle = textarea.value
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "")
                .join(joinCharacter);

            textarea.remove(); // Remove the textarea
            changeValue(input, updatedStyle); // Update input with the final value
        });

        // Focus on the textarea
        textarea.focus();
    }
};

// Access the iframe and locate the element with ie-dropdown
const locateDropdownElement = (dropdownId) => {
    const iframe = document.getElementById("site-iframe-next");
    if (!iframe) {
        console.error("Iframe with ID 'site-iframe-next' not found.");
        return null;
    }

    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    if (!iframeDocument) {
        console.error("Unable to access iframe content.");
        return null;
    }

    // Locate the element with ie-dropdown inside the iframe
    const dropdownElement = iframeDocument.querySelector(`[ie-dropdown="${dropdownId}"]`);
    if (!dropdownElement) {
        console.error(`Element with ie-dropdown="${dropdownId}" not found in iframe.`);
        return null;
    }

    return dropdownElement;
};

// Show a custom options menu below the input
const enhanceInputWithOptions = (input) => {
    const automationId = input.getAttribute("data-automation-id");
    const dropdownIdMatch = automationId.match(/Dropdown="([^"]+)"/); // Extract ID after 'Dropdown='
    const dropdownId = dropdownIdMatch ? dropdownIdMatch[1] : null;

    if (!dropdownId) {
        console.error("Dropdown ID not found in data-automation-id.");
        return;
    }

    // Locate the dropdown element inside the iframe
    const dropdownElement = locateDropdownElement(dropdownId);
    if (!dropdownElement) {
        return; // Exit if the element isn't found
    }

    // Extract options from the text content of the dropdown element
    const options = dropdownElement.textContent.split(",").map((option) => option.trim());

    // Check if an options menu already exists
    let existingOptionsMenu = input.nextElementSibling;
    if (existingOptionsMenu && existingOptionsMenu.classList.contains("custom-options-menu")) {
        existingOptionsMenu.focus();
        return;
    }

    // Create a custom options menu
    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("custom-options-menu");
    optionsMenu.style.backgroundColor = "#1e1e1e";
    optionsMenu.style.color = "#fff";
    optionsMenu.style.position = "absolute";
    optionsMenu.style.marginTop = "8px";
    optionsMenu.style.width = `${input.offsetWidth}px`;
    optionsMenu.style.border = "1px solid #333";
    optionsMenu.style.borderRadius = "4px";
    optionsMenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
    optionsMenu.style.zIndex = "1000";

    options.forEach((option) => {
        const optionItem = document.createElement("div");
        optionItem.textContent = option;
        optionItem.style.padding = "8px";
        optionItem.style.cursor = "pointer";
        optionItem.style.backgroundColor = "#1e1e1e";
        optionItem.style.color = "#fff";
        optionItem.style.borderBottom = "1px solid #333";
        optionItem.addEventListener("mouseover", () => {
            optionItem.style.backgroundColor = "#333";
            optionItem.style.color = "#fff";
        });
        optionItem.addEventListener("mouseout", () => {
            optionItem.style.backgroundColor = "#1e1e1e";
            optionItem.style.color = "#fff";
        });
        optionItem.addEventListener("click", () => {
            changeValue(input, option); // Update input value immediately
            optionsMenu.remove(); // Remove dropdown immediately after selection
        });

        optionsMenu.appendChild(optionItem);
    });

    if (optionsMenu.lastChild) {
        optionsMenu.lastChild.style.borderBottom = "none";
    }

    // Insert the options menu below the input
    input.parentNode.insertBefore(optionsMenu, input.nextSibling);

    // Close the menu when clicking outside
    document.addEventListener(
        "click",
        (event) => {
            if (!optionsMenu.contains(event.target) && event.target !== input) {
                optionsMenu.remove();
            }
        },
        { once: true }
    );

    // Remove dropdown menu when the input loses focus with delay
    input.addEventListener("blur", () => {
        setTimeout(() => {
            optionsMenu.remove();
        }, 100); // Slight delay to allow option click to register
    });
};

// Enhance inputs with specific criteria
const enhanceInputsWithTextarea = () => {
    const inputs = document.querySelectorAll('input[data-wf-base-text-input]');
    inputs.forEach((input) => {
        const automationId = input.getAttribute("data-automation-id");
        if (automationId.includes("Style")) {
            input.addEventListener("focus", () => enhanceInputWithTextarea(input, "Style"));
        } else if (automationId.includes("Class")) {
            input.addEventListener("focus", () => enhanceInputWithTextarea(input, "Class"));
        } else if (automationId.includes("Dropdown")) {
            input.addEventListener("focus", () => enhanceInputWithOptions(input));
        }
    });
};

// Wait for #right-sidebar to exist
const waitForRightSidebar = () => {
    const sidebar = document.getElementById("right-sidebar");
    if (sidebar) {
        enhanceInputsWithTextarea();
        const observer = new MutationObserver(() => {
            enhanceInputsWithTextarea();
        });
        observer.observe(sidebar, { childList: true, subtree: true });
    } else {
        setTimeout(waitForRightSidebar, 100);
    }
};

// Start the script
console.log("Webflow Input Enhancer loaded.");
waitForRightSidebar();