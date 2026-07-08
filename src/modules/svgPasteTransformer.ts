// Intercepts any paste event whose content is an SVG and rewrites
// the <svg> opening tag + hard-coded fill colors so the SVG plays
// nicely with Webflow's currentColor conventions.
//
// Rewrites applied:
//   - width / height  → 100%
//   - Adds aria-hidden="true" and role="img" if missing
//   - Every fill="..." except "none" / "currentColor" → currentColor

const isSvg = (text: string): boolean => {
  return /^\s*<svg\b/i.test(text);
};

export const transformSvg = (svg: string): string => {
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

  // aria-hidden (after height)
  if (!/\saria-hidden\s*=/i.test(attrs)) {
    attrs = attrs.replace(
      /(\sheight="100%")/,
      '$1 aria-hidden="true"'
    );
  }

  // role="img" (after aria-hidden)
  if (!/\srole\s*=/i.test(attrs)) {
    attrs = attrs.replace(
      /(\saria-hidden="true")/,
      '$1 role="img"'
    );
  }

  const newOpener = `<svg${attrs}>`;
  let result = svg.replace(/<svg\b[^>]*>/i, newOpener);

  // Replace hard-coded fill values with currentColor, keeping
  // fill="none" (used for stroke-only paths) and existing
  // currentColor references.
  result = result.replace(
    /fill\s*=\s*"([^"]*)"/gi,
    (match, value: string) => {
      const v = value.trim().toLowerCase();
      if (v === "none" || v === "currentcolor") return match;
      return 'fill="currentColor"';
    }
  );

  return result;
};

const insertText = (
  target: EventTarget | null,
  text: string
): boolean => {
  if (!target) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText(text, start, end, "end");
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
    return document.execCommand("insertText", false, text);
  }
  return false;
};

let installed = false;

export const installSvgPasteTransformer = () => {
  if (installed) return;
  installed = true;
  document.addEventListener(
    "paste",
    (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const text = event.clipboardData.getData("text/plain");
      if (!text || !isSvg(text)) return;
      const transformed = transformSvg(text);
      if (transformed === text) return;
      if (insertText(event.target, transformed)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
};
