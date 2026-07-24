import {
  readSvgThemeColorsEnabled,
  setSvgThemeColorsEnabled,
} from "../utils/svgTransformStore";

const checkbox =
  document.querySelector<HTMLInputElement>("#theme-colors");

if (checkbox) {
  //reflect the persisted value before the user can interact
  readSvgThemeColorsEnabled().then((enabled) => {
    checkbox.checked = enabled;
  });

  checkbox.addEventListener("change", () => {
    setSvgThemeColorsEnabled(checkbox.checked);
  });
}

// The bypass rides on the browser's "paste and match style"
// command, whose shortcut differs per platform:
//   macOS   Cmd + Shift + Option + V
//   Win/Linux  Ctrl + Shift + V
// Both carry Shift, which is what the content script checks for.
const platform =
  (navigator as any).userAgentData?.platform ||
  navigator.platform ||
  navigator.userAgent;
const isMac = /mac/i.test(platform);

//the macOS chord is the static default in popup.html, so there is
//nothing to swap when we are already on a Mac
if (!isMac) {
  const chord =
    document.querySelector<HTMLElement>("#bypass-chord");
  if (chord) {
    chord.replaceChildren();
    ["Ctrl", "Shift", "V"].forEach((key, index) => {
      if (index > 0) {
        chord.appendChild(document.createTextNode(" + "));
      }
      const kbd = document.createElement("kbd");
      kbd.textContent = key;
      chord.appendChild(kbd);
    });
  }
}
