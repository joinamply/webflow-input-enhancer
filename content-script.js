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
            // console.log("React state updated:", value);
        } else {
            console.error("React onChange not found in fiber.");
        }
    } else {
        // console.warn("React fiber not found. Falling back to native events.");
        simulateNativeInput(el, value);
    }
};

// Fallback to simulate native input events
const simulateNativeInput = (el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    // console.log("Simulated input and change events:", value);
};

// Adjust the height of the textarea dynamically
const autoResizeTextarea = (textarea) => {
    textarea.style.height = "auto"; // Reset height to auto to calculate scroll height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height to match content
};

// Replace textarea back with input safely
const restoreInput = (textarea, input, updatedStyle) => {
    const tryRestore = () => {
        if (textarea.parentNode) {
            textarea.parentNode.replaceChild(input, textarea);
            // console.log("Input successfully restored.");
            changeValue(input, updatedStyle); // Use React or fallback to native
        } else {
            // console.warn("Textarea parentNode is null. Retrying...");
            setTimeout(tryRestore, 100);
        }
    };
    tryRestore();
};

// Replace input with textarea safely
const replaceInputWithTextarea = (input) => {
    const styleValue = input.value;

    if (styleValue.includes(":") && styleValue.includes(";")) {
        // console.log("Input detected, replacing with textarea...");

        const formattedStyle = styleValue
            .split(";")
            .filter((style) => style.trim() !== "")
            .map((style) => style.trim())
            .join("\n");

        const textarea = document.createElement("textarea");
        textarea.value = formattedStyle;
        textarea.style = input.getAttribute("style");
        textarea.style.whiteSpace = "pre-wrap";
        textarea.style.overflow = "hidden";
        textarea.style.resize = "none";

        if (input.parentNode) {
            input.parentNode.replaceChild(textarea, input);
            autoResizeTextarea(textarea);

            textarea.addEventListener("input", () => autoResizeTextarea(textarea));

            textarea.addEventListener("blur", () => {
                // console.log("Textarea blur event, restoring input...");
                const updatedStyle = textarea.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line !== "")
                    .join("; ") + ";";

                restoreInput(textarea, input, updatedStyle);
            });
        } else {
            // console.error("Input parentNode is null. Skipping replacement.");
        }
    }
};

// Enhance inputs with specific criteria
const enhanceInputsWithTextarea = () => {
    // console.log("Enhancing inputs...");
    const inputs = document.querySelectorAll('input[data-wf-base-text-input]');

    // Filter inputs where data-automation-id contains "Style"
    const styleInputs = Array.from(inputs).filter((input) => {
        const automationId = input.getAttribute("data-automation-id");
        return automationId && automationId.includes("Style");
    });

    styleInputs.forEach((input) => {
        input.addEventListener("focus", () => replaceInputWithTextarea(input));
    });
};

// Wait for #right-sidebar to exist
const waitForRightSidebar = () => {
    const sidebar = document.getElementById("right-sidebar");
    if (sidebar) {
        // console.log("Right-sidebar detected. Enhancing inputs...");
        enhanceInputsWithTextarea();

        const observer = new MutationObserver(() => {
            // console.log("Sidebar updated. Re-enhancing inputs...");
            enhanceInputsWithTextarea();
        });

        observer.observe(sidebar, { attributes: true , childList: true, subtree: true });
    } else {
        // console.log("Waiting for #right-sidebar...");
        setTimeout(waitForRightSidebar, 100);
    }
};

// Start the script
console.log("Webflow Input Enhancer loaded. Waiting for Webflow...");
waitForRightSidebar();