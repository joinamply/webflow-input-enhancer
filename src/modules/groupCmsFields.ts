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
const GROUP_COUNT_ATTR = "ei-cms-group-count";
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

const isFieldFilled = (field: HTMLElement): boolean => {
  const inputs = field.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >("input, textarea");
  for (const input of Array.from(inputs)) {
    const val = (input.value || "").trim();
    if (val.length > 0) return true;
  }
  return false;
};

const updateGroupCount = (wrapper: HTMLElement) => {
  const body = wrapper.querySelector<HTMLElement>(
    `[${GROUP_BODY_ATTR}]`
  );
  if (!body) return;
  const counter = wrapper.querySelector<HTMLElement>(
    `[${GROUP_COUNT_ATTR}]`
  );
  if (!counter) return;
  const fields = Array.from(body.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
  const total = fields.length;
  const filled = fields.filter(isFieldFilled).length;
  const text = `${filled}/${total}`;
  if (counter.textContent !== text) {
    counter.textContent = text;
  }
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
  label.style.flex = "1";
  makeElMutationChangeSafe(label);

  const counter = document.createElement("span");
  counter.setAttribute(GROUP_COUNT_ATTR, "true");
  counter.style.fontSize = "10px";
  counter.style.fontWeight = "500";
  counter.style.color = "var(--colors-text-secondary)";
  counter.style.opacity = "0.75";
  counter.style.marginLeft = "auto";
  counter.style.fontVariantNumeric = "tabular-nums";
  makeElMutationChangeSafe(counter);

  heading.appendChild(chevron);
  heading.appendChild(label);
  heading.appendChild(counter);
  wrapper.appendChild(heading);

  const body = document.createElement("div");
  body.setAttribute(GROUP_BODY_ATTR, "true");
  body.setAttribute("ei-skip", "true");
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.marginTop = "6px";
  makeElMutationChangeSafe(body);
  wrapper.appendChild(body);

  // Live-update the count when any input within this group changes.
  const onInputChange = () => updateGroupCount(wrapper);
  body.addEventListener("input", onInputChange);
  body.addEventListener("change", onInputChange);

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

const undoFieldGrouping = () => {
  document
    .querySelectorAll<HTMLElement>(`[${GROUP_WRAPPER_ATTR}]`)
    .forEach((wrapper) => {
      const wrapperParent = wrapper.parentElement;
      if (!wrapperParent) return;
      const body = wrapper.querySelector<HTMLElement>(
        `[${GROUP_BODY_ATTR}]`
      );
      if (body) {
        Array.from(body.children).forEach((child) => {
          if (child instanceof HTMLElement) {
            wrapperParent.insertBefore(child, wrapper);
          }
        });
      }
      wrapper.remove();
    });
  document
    .querySelectorAll<HTMLElement>(
      `[${GROUP_PROCESSED_ATTR}]`
    )
    .forEach((hint) => {
      hint.removeAttribute(GROUP_PROCESSED_ATTR);
      (hint as HTMLElement).style.removeProperty("display");
    });
};

// Field grouping via [Group=NAME] help-text markers is disabled
// because Webflow shipped native CMS field groups. This function
// only tears down any leftover wrappers each tick — no new
// grouping happens.
export const groupCmsFields = () => {
  undoFieldGrouping();
};

// Keep the disabled helpers referenced so TypeScript doesn't
// flag them while grouping is turned off. Re-enable by restoring
// the original implementation from git history if needed.
void GROUP_REGEX;
void GROUP_LEADING_REGEX;
void HINT_SELECTOR;
void GROUP_HEADING_ATTR;
void GROUP_CHEVRON_ATTR;
void GROUP_COUNT_ATTR;
void hydrateCollapsedGroups;
void persistCollapsedGroups;
void applyCollapsedState;
void isFieldFilled;
void updateGroupCount;
void findFieldWrapper;
void cleanGroupText;
void buildGroupWrapper;
void makeElMutationChangeSafe;
void debug;

const _disabledGroupCmsFields = () => {
  hydrateCollapsedGroups();

  // Refresh counts on any existing group wrappers so the
  // filled/total ratio stays in sync with field values.
  document
    .querySelectorAll<HTMLElement>(`[${GROUP_WRAPPER_ATTR}]`)
    .forEach((wrapper) => updateGroupCount(wrapper));

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
    updateGroupCount(wrapper);

    debug(
      `✅ [CMS Group] Grouped ${entries.length} field(s) under "${groupName}"`
    );
  });
};
void _disabledGroupCmsFields;
