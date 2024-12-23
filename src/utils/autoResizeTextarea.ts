// Function to auto-resize the textarea based on its content
export const autoResizeTextarea = (
  textarea: HTMLTextAreaElement
) => {
  textarea.style.height = "auto"; // Reset height to auto for recalculation
  textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scrollHeight
};
