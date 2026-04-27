import { debug } from "./debug";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

const GROUP_REGEX = /\[Group=([^\]]+)\]/i;
// Hint text must START with the marker (optional whitespace), but
// any descriptive text after the closing bracket is fine. This
// avoids false matches on hints that merely embed the collection
// name (those don't start with the marker).
const GROUP_LEADING_REGEX = /^\s*\[Group=([^\]]+)\]/i;
const HINT_SELECTOR = `span[data-automation-id$="-hint"]`;
const GROUP_WRAPPER_ATTR = "ei-cms-group";
const GROUP_HEADING_ATTR = "ei-cms-group-heading";
const GROUP_BODY_ATTR = "ei-cms-group-body";
const GROUP_CHEVRON_ATTR = "ei-cms-group-chevron";
const GROUP_PROCESSED_ATTR = "ei-cms-group-processed";
const COLLAPSE_STORAGE_KEY = "eiCmsGroupCollapsed";

const collapsedGroups = new Set<string>();
let storageHydrated = false;

const hydrateCollapsedGroups = () => {
  if (storageHydrated) return;
  storageHydrated = true;
  try {
    chrome.storage?.local
      ?.get([COLLAPSE_STORAGE_KEY])
      .then((result) => {
        const stored = result?.[COLLAPSE_STORAGE_KEY];
        if (Array.isArray(stored)) {
          stored.forEach((name) => {
            if (typeof name === "string") {
              collapsedGroups.add(name);
            }
          });
          document
            .querySelectorAll<HTMLElement>(
              `[${GROUP_WRAPPER_ATTR}]`
            )
            .forEach((wrapper) => {
              const name = wrapper.getAttribute(
                GROUP_WRAPPER_ATTR
              );
              if (name) applyCollapsedState(wrapper, name);
            });
        }
      });
  } catch {
    // chrome.storage unavailable; in-memory only
  }
};

const persistCollapsedGroups = () => {
  try {
    chrome.storage?.local?.set({
      [COLLAPSE_STORAGE_KEY]: Array.from(collapsedGroups),
    });
  } catch {
    // ignore
  }
};

const applyCollapsedState = (
  wrapper: HTMLElement,
  groupName: string
) => {
  const body = wrapper.querySelector<HTMLElement>(
    `[${GROUP_BODY_ATTR}]`
  );
  const chevron = wrapper.querySelector<HTMLElement>(
    `[${GROUP_CHEVRON_ATTR}]`
  );
  const collapsed = collapsedGroups.has(groupName);
  if (body) {
    body.style.display = collapsed ? "none" : "flex";
  }
  if (chevron) {
    chevron.style.transform = collapsed
      ? "rotate(-90deg)"
      : "rotate(0deg)";
  }
  wrapper.setAttribute(
    "ei-cms-group-collapsed",
    collapsed ? "true" : "false"
  );
};

const findFieldWrapper = (
  hintEl: HTMLElement
): HTMLElement | null => {
  let current: HTMLElement | null = hintEl;
  let depth = 0;
  const MAX_DEPTH = 10;

  while (
    current &&
    current.parentElement &&
    depth < MAX_DEPTH
  ) {
    const parent: HTMLElement = current.parentElement;
    if (parent.children.length > 1) {
      const siblingsWithHints = Array.from(
        parent.children
      ).filter(
        (sibling: Element) =>
          sibling !== current &&
          sibling.querySelector(HINT_SELECTOR) !== null
      );
      if (siblingsWithHints.length >= 1) {
        return current;
      }
    }
    current = parent;
    depth++;
  }
  return null;
};

const cleanGroupText = (hintEl: HTMLElement) => {
  const text = hintEl.textContent || "";
  const stripped = text.replace(GROUP_REGEX, "").trim();
  if (stripped.length === 0) {
    hintEl.style.display = "none";
  } else {
    hintEl.textContent = stripped;
  }
};

const buildGroupWrapper = (
  groupName: string
): { wrapper: HTMLElement; body: HTMLElement } => {
  const wrapper = document.createElement("div");
  wrapper.setAttribute(GROUP_WRAPPER_ATTR, groupName);
  wrapper.setAttribute("ei-skip", "true");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.border =
    "1px solid var(--colors-border-secondary, rgba(255,255,255,0.08))";
  wrapper.style.borderRadius = "4px";
  wrapper.style.padding = "8px";
  wrapper.style.margin = "8px 0";
  wrapper.style.background =
    "var(--colors-background-secondary, rgba(255,255,255,0.02))";
  makeElMutationChangeSafe(wrapper);

  const heading = document.createElement("div");
  heading.setAttribute(GROUP_HEADING_ATTR, "true");
  heading.style.display = "flex";
  heading.style.alignItems = "center";
  heading.style.gap = "6px";
  heading.style.cursor = "pointer";
  heading.style.fontSize = "11px";
  heading.style.fontWeight = "600";
  heading.style.textTransform = "uppercase";
  heading.style.letterSpacing = "0.04em";
  heading.style.color = "var(--colors-text-secondary)";
  heading.style.userSelect = "none";
  makeElMutationChangeSafe(heading);

  const chevron = document.createElement("span");
  chevron.setAttribute(GROUP_CHEVRON_ATTR, "true");
  chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 4.5l3 3 3-3"/></svg>`;
  chevron.style.display = "inline-flex";
  chevron.style.alignItems = "center";
  chevron.style.transition = "transform 120ms ease";
  makeElMutationChangeSafe(chevron);
  const chevronSvg = chevron.querySelector("svg");
  if (chevronSvg) makeElMutationChangeSafe(chevronSvg);

  const label = document.createElement("span");
  label.textContent = groupName;
  makeElMutationChangeSafe(label);

  heading.appendChild(chevron);
  heading.appendChild(label);
  wrapper.appendChild(heading);

  const body = document.createElement("div");
  body.setAttribute(GROUP_BODY_ATTR, "true");
  body.setAttribute("ei-skip", "true");
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.marginTop = "6px";
  makeElMutationChangeSafe(body);
  wrapper.appendChild(body);

  heading.addEventListener("click", () => {
    if (collapsedGroups.has(groupName)) {
      collapsedGroups.delete(groupName);
    } else {
      collapsedGroups.add(groupName);
    }
    applyCollapsedState(wrapper, groupName);
    persistCollapsedGroups();
  });

  return { wrapper, body };
};

export const groupCmsFields = () => {
  hydrateCollapsedGroups();

  // Match hints whose text STARTS with [Group=NAME]. This works
  // for component instance properties AND CMS item edit forms,
  // while avoiding false matches on CMS Collection Settings hints
  // (which merely embed the collection name mid-sentence).
  const hints = Array.from(
    document.querySelectorAll<HTMLElement>(HINT_SELECTOR)
  ).filter((hint) => {
    const text = hint.textContent || "";
    return GROUP_LEADING_REGEX.test(text);
  });

  if (hints.length === 0) {
    return;
  }

  type FieldEntry = {
    field: HTMLElement;
    hint: HTMLElement;
  };
  const groups = new Map<string, FieldEntry[]>();

  for (const hint of hints) {
    if (hint.hasAttribute(GROUP_PROCESSED_ATTR)) {
      continue;
    }
    const match = (hint.textContent || "").match(GROUP_REGEX);
    if (!match) continue;
    const groupName = match[1].trim();
    if (!groupName) continue;

    const field = findFieldWrapper(hint);
    if (!field) {
      debug(
        "🙀 [CMS Group] Field wrapper not found for hint",
        hint
      );
      continue;
    }
    if (field.closest(`[${GROUP_WRAPPER_ATTR}]`)) {
      hint.setAttribute(GROUP_PROCESSED_ATTR, "true");
      continue;
    }

    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push({ field, hint });
  }

  groups.forEach((entries, groupName) => {
    if (entries.length === 0) return;
    const firstField = entries[0].field;
    const parent = firstField.parentElement;
    if (!parent) return;

    let wrapper = parent.querySelector<HTMLElement>(
      `[${GROUP_WRAPPER_ATTR}="${CSS.escape(groupName)}"]`
    );
    let body: HTMLElement | null = null;

    if (!wrapper) {
      const built = buildGroupWrapper(groupName);
      wrapper = built.wrapper;
      body = built.body;
      parent.insertBefore(wrapper, firstField);
      makeElMutationChangeSafe(parent);
    } else {
      body = wrapper.querySelector<HTMLElement>(
        `[${GROUP_BODY_ATTR}]`
      );
    }

    if (!body) return;

    entries.forEach(({ field, hint }) => {
      makeElMutationChangeSafe(field);
      makeElMutationChangeSafe(hint);
      body!.appendChild(field);
      cleanGroupText(hint);
      hint.setAttribute(GROUP_PROCESSED_ATTR, "true");
    });

    applyCollapsedState(wrapper, groupName);

    debug(
      `✅ [CMS Group] Grouped ${entries.length} field(s) under "${groupName}"`
    );
  });
};
