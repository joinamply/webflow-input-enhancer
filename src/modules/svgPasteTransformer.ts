import { getSvgThemeColorsEnabled } from "../utils/svgTransformStore";

// Intercepts any paste event whose content is an SVG and rewrites
// the <svg> opening tag + hard-coded fill colors so the SVG plays
// nicely with Webflow's currentColor conventions.
//
// Always applied:
//   - width / height  → 100%
//   - Adds aria-hidden="true" and role="img" if missing
//
// Applied unless disabled in the popup or bypassed by holding
// Shift+Option while pasting:
//   - Every fill="..." except "none" / "currentColor" → currentColor

const isSvg = (text: string): boolean => {
  return /^\s*<svg\b/i.test(text);
};

export type TransformSvgOptions = {
  //rewrite hard-coded fills to currentColor (default true)
  themeColors?: boolean;
};

export const transformSvg = (
  svg: string,
  options: TransformSvgOptions = {}
): string => {
  const { themeColors = true } = options;
  const opener = svg.match(/<svg\b([^>]*)>/i);
  if (!opener) return svg;

  let attrs = opener[1];

  // width
  if (/\swidth\s*=\s*"[^"]*"/i.test(attrs)) {
    attrs = attrs.replace(
      /\swidth\s*=\s*"[^"]*"/i,
      ' width="100%"'
    );
  } else {
    attrs = ' width="100%"' + attrs;
  }

  // height (place right after width)
  if (/\sheight\s*=\s*"[^"]*"/i.test(attrs)) {
    attrs = attrs.replace(
      /\sheight\s*=\s*"[^"]*"/i,
      ' height="100%"'
    );
  } else {
    attrs = attrs.replace(
      /(\swidth="100%")/,
      '$1 height="100%"'
    );
  }

  // Accessibility attributes are always applied. Anchor them after
  // width/height when those exist so the attribute order stays
  // readable, without depending on the sizing rewrite having run.
  const a11yAttrs: string[] = [];
  if (!/\saria-hidden\s*=/i.test(attrs)) {
    a11yAttrs.push('aria-hidden="true"');
  }
  if (!/\srole\s*=/i.test(attrs)) {
    a11yAttrs.push('role="img"');
  }
  if (a11yAttrs.length > 0) {
    const insert = ` ${a11yAttrs.join(" ")}`;
    if (/\sheight\s*=\s*"[^"]*"/i.test(attrs)) {
      attrs = attrs.replace(
        /(\sheight\s*=\s*"[^"]*")/i,
        `$1${insert}`
      );
    } else if (/\swidth\s*=\s*"[^"]*"/i.test(attrs)) {
      attrs = attrs.replace(
        /(\swidth\s*=\s*"[^"]*")/i,
        `$1${insert}`
      );
    } else {
      attrs = insert + attrs;
    }
  }

  const newOpener = `<svg${attrs}>`;
  let result = svg.replace(/<svg\b[^>]*>/i, newOpener);

  // Replace hard-coded fill values with currentColor, keeping
  // fill="none" (used for stroke-only paths) and existing
  // currentColor references.
  if (themeColors) {
    result = result.replace(
      /fill\s*=\s*"([^"]*)"/gi,
      (match, value: string) => {
        const v = value.trim().toLowerCase();
        if (v === "none" || v === "currentcolor") return match;
        return 'fill="currentColor"';
      }
    );
  }

  return result;
};

// Returns true only when the text actually landed. A false return
// leaves the native paste untouched, which is far better than
// swallowing the event on a field that rejected our write.
const insertText = (
  target: EventTarget | null,
  text: string
): boolean => {
  if (!target) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    if (target.readOnly || target.disabled) return false;
    const before = target.value;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText(text, start, end, "end");
    if (target.value === before) return false;
    target.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    target.dispatchEvent(
      new Event("change", { bubbles: true })
    );
    return true;
  }
  if (
    target instanceof HTMLElement &&
    target.isContentEditable
  ) {
    const before = target.textContent;
    const ok = document.execCommand(
      "insertText",
      false,
      text
    );
    //execCommand can report success without changing anything
    if (!ok || target.textContent === before) return false;
    return true;
  }
  return false;
};

// ClipboardEvent carries no modifier state, so track the bypass
// modifier separately.
//
// Either Option(Alt) or Shift satisfies the check, but the
// documented chord is Shift+Option because each modifier alone
// collides with a browser shortcut:
//   - Cmd+Shift+V  is Chromium's "paste as plain text", a
//     different internal path that doesn't reliably let us write
//     into the field.
//   - Cmd+Option+V is swallowed by Arc before it reaches the page.
// Cmd+Shift+Option+V matches neither binding, so it falls through
// to a plain paste and reaches this handler intact.
//
// Two sources, because neither alone is reliable:
//   1. The modifier read straight off the Cmd/Ctrl+V keystroke.
//      This is the accurate one — macOS suppresses keyup for other
//      keys while Cmd is held, so press/release tracking drifts.
//   2. Press/release tracking, used as a fallback for pastes that
//      don't come from the keyboard (context menu, for example).
let modifierHeld = false;
let pasteKeyModifier = false;
let pasteKeyAt = 0;

//how long a keyboard paste keystroke stays authoritative
const PASTE_KEY_WINDOW_MS = 500;

const isBypassKey = (key: string) =>
  key === "Shift" || key === "Alt";

const trackBypassModifier = () => {
  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (isBypassKey(e.key)) modifierHeld = true;
      //e.code is the physical key: on macOS Option+V reports
      //e.key as "√", so matching on e.key alone would miss it
      const isPasteKeystroke =
        (e.metaKey || e.ctrlKey) &&
        (e.code === "KeyV" || e.key.toLowerCase() === "v");
      if (isPasteKeystroke) {
        pasteKeyModifier = e.shiftKey || e.altKey;
        pasteKeyAt = Date.now();
      }
    },
    true
  );
  document.addEventListener(
    "keyup",
    (e: KeyboardEvent) => {
      if (isBypassKey(e.key)) modifierHeld = false;
    },
    true
  );
  //a keyup can be missed if focus leaves mid-press
  window.addEventListener("blur", () => {
    modifierHeld = false;
  });
};

const isBypassActive = (): boolean => {
  if (Date.now() - pasteKeyAt < PASTE_KEY_WINDOW_MS) {
    return pasteKeyModifier;
  }
  return modifierHeld;
};

let installed = false;

export const installSvgPasteTransformer = () => {
  if (installed) return;
  installed = true;
  trackBypassModifier();
  document.addEventListener(
    "paste",
    (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const text = event.clipboardData.getData("text/plain");
      if (!text || !isSvg(text)) return;
      const transformed = transformSvg(text, {
        themeColors:
          getSvgThemeColorsEnabled() && !isBypassActive(),
      });
      if (transformed === text) return;
      if (insertText(event.target, transformed)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
};
