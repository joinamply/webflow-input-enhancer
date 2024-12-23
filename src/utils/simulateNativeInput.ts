// Fallback to simulate native input events
export const simulateNativeInput = (
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string | number
) => {
  el.value = value.toString();
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
};
