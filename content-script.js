// Function to format style attributes
function formatStyleAttributes() {
    // Select all custom element attributes with a style tag
    const styleInputs = document.querySelectorAll('[style]');

    styleInputs.forEach((element) => {
        // Original style content
        const styleContent = element.getAttribute("style");

        // Format the style attribute
        const formattedStyle = styleContent
            .split(";") // Split each style property
            .filter((style) => style.trim() !== "") // Remove empty entries
            .map((style) => style.trim()) // Trim whitespace
            .join(";\n"); // Join styles with a new line

        // Update the style attribute for better readability
        element.setAttribute("style", formattedStyle);

        // Get the corresponding input field
        const inputField = element.querySelector('input[style]'); // Adjust this selector to your input field structure

        if (inputField) {
            // Update input field value
            inputField.value = formattedStyle;

            // Dynamically increase height based on content
            inputField.style.height = `${formattedStyle.split("\n").length * 20}px`;
        }
    });
}

// Run the script when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Monitor the DOM for changes to dynamically handle new elements
    const observer = new MutationObserver(() => formatStyleAttributes());

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial execution
    formatStyleAttributes();
});