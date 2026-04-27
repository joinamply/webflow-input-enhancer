import { debug } from "./debug";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

const GROUP_REGEX = /\s*\[Group=([^\]]+)\]\s*/i;
const COLLECTION_SELECTOR = `[draggable="true"][data-automation-id]`;
const GROUP_WRAPPER_ATTR = "ei-collection-group";
const GROUP_HEADING_ATTR = "ei-collection-group-heading";
const GROUP_BODY_ATTR = "ei-collection-group-body";
const GROUP_CHEVRON_ATTR = "ei-collection-group-chevron";
const GROUPED_ITEM_ATTR = "ei-collection-grouped-item";
const LIST_ITEM_ATTR = "ei-collection-item";
const COLLAPSE_STORAGE_KEY = "eiCollectionGroupCollapsed";
const REORDER_STORAGE_KEY = "eiCollectionReorderMode";
const PANEL_HEADER_SELECTOR = `[data-automation-id="panel-header"]`;
const PANE_TITLE_SELECTOR = `[data-automation-id="pane-title"]`;
const TOGGLE_BAR_ATTR = "ei-collection-reorder-bar";
const TOGGLE_ATTR = "ei-collection-reorder-toggle";
const TOGGLE_CIRCLE_ATTR = "ei-collection-reorder-toggle-circle";
const TOGGLE_BG_ATTR = "ei-collection-reorder-toggle-bg";

const collapsedGroups = new Set<string>();
let storageHydrated = false;
let reorderHydrated = false;
let reorderMode = false;
const observedParents = new WeakSet<HTMLElement>();
let dragGuardInstalled = false;

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
    // chrome.storage unavailable
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
      ? "rotate(0deg)"
      : "rotate(90deg)";
  }
  wrapper.setAttribute(
    "ei-collection-group-collapsed",
    collapsed ? "true" : "false"
  );
};

const findGroupTextNode = (
  root: HTMLElement
): Text | null => {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  let node = walker.nextNode();
  while (node) {
    if (
      node.textContent &&
      GROUP_REGEX.test(node.textContent)
    ) {
      return node as Text;
    }
    node = walker.nextNode();
  }
  return null;
};

const cleanGroupText = (item: HTMLElement) => {
  const textNode = findGroupTextNode(item);
  if (!textNode) return;
  if (!(textNode as any).__eiOriginalText) {
    (textNode as any).__eiOriginalText = textNode.textContent;
  }
  const cleaned = (textNode.textContent || "")
    .replace(GROUP_REGEX, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  textNode.textContent = cleaned;
};

const restoreGroupText = (item: HTMLElement) => {
  const walker = document.createTreeWalker(
    item,
    NodeFilter.SHOW_TEXT
  );
  let node = walker.nextNode();
  while (node) {
    const original = (node as any).__eiOriginalText;
    if (original) {
      node.textContent = original;
      delete (node as any).__eiOriginalText;
    }
    node = walker.nextNode();
  }
};


const disableItemDrag = (item: HTMLElement) => {
  item.setAttribute("draggable", "false");
  item.style.cursor = "default";
};

const installDragGuard = () => {
  if (dragGuardInstalled) return;
  dragGuardInstalled = true;
  // Capture-phase guard: kill any drag that originates inside a
  // CMS collection item we've taken over (grouped or sibling),
  // before React-DnD's listeners fire.
  document.addEventListener(
    "dragstart",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLElement)) return;
      if (target.closest(`[${LIST_ITEM_ATTR}]`)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    { capture: true }
  );
};

const markAsListItem = (item: HTMLElement) => {
  makeElMutationChangeSafe(item);
  item.setAttribute(LIST_ITEM_ATTR, "true");
  disableItemDrag(item);
};

const buildCollectionGroupWrapper = (
  groupName: string
): { wrapper: HTMLElement; body: HTMLElement } => {
  const wrapper = document.createElement("div");
  wrapper.setAttribute(GROUP_WRAPPER_ATTR, groupName);
  wrapper.setAttribute("ei-skip", "true");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  makeElMutationChangeSafe(wrapper);

  const heading = document.createElement("div");
  heading.setAttribute(GROUP_HEADING_ATTR, "true");
  heading.style.display = "flex";
  heading.style.alignItems = "center";
  heading.style.gap = "6px";
  heading.style.cursor = "pointer";
  heading.style.height = "32px";
  heading.style.padding = "0 8px";
  heading.style.fontSize = "11.5px";
  heading.style.fontWeight = "500";
  heading.style.color = "var(--colors-text-secondary)";
  heading.style.userSelect = "none";
  heading.style.borderRadius = "4px";
  makeElMutationChangeSafe(heading);

  const chevron = document.createElement("span");
  chevron.setAttribute(GROUP_CHEVRON_ATTR, "true");
  chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.29293 8.00004L5.64648 4.35359L6.35359 3.64648L10.7071 8.00004L6.35359 12.3536L5.64648 11.6465L9.29293 8.00004Z" fill="currentColor"/></svg>`;
  chevron.style.display = "inline-flex";
  chevron.style.alignItems = "center";
  chevron.style.transition = "transform 120ms ease";
  makeElMutationChangeSafe(chevron);
  const chevronSvg = chevron.querySelector("svg");
  if (chevronSvg) makeElMutationChangeSafe(chevronSvg);

  const label = document.createElement("span");
  label.textContent = groupName;
  label.style.overflow = "hidden";
  label.style.textOverflow = "ellipsis";
  label.style.whiteSpace = "nowrap";
  label.style.flex = "1";
  makeElMutationChangeSafe(label);

  heading.appendChild(chevron);
  heading.appendChild(label);
  wrapper.appendChild(heading);

  const body = document.createElement("div");
  body.setAttribute(GROUP_BODY_ATTR, "true");
  body.setAttribute("ei-skip", "true");
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.paddingLeft = "12px";
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

const observeParent = (parent: HTMLElement) => {
  if (observedParents.has(parent)) return;
  observedParents.add(parent);
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      groupCmsCollections();
    });
  });
  observer.observe(parent, {
    childList: true,
    subtree: false,
  });
};

const findExistingWrapper = (
  parent: HTMLElement,
  groupName: string
): HTMLElement | null => {
  for (const child of Array.from(parent.children)) {
    if (
      child instanceof HTMLElement &&
      child.getAttribute(GROUP_WRAPPER_ATTR) === groupName
    ) {
      return child;
    }
  }
  return null;
};

const hydrateReorderMode = () => {
  if (reorderHydrated) return;
  reorderHydrated = true;
  try {
    chrome.storage?.local
      ?.get([REORDER_STORAGE_KEY])
      .then((result) => {
        if (result?.[REORDER_STORAGE_KEY] === true) {
          reorderMode = true;
        }
        renderToggleStates();
        if (reorderMode) {
          undoGrouping();
        }
      });
  } catch {
    // ignore
  }
};

const persistReorderMode = () => {
  try {
    chrome.storage?.local?.set({
      [REORDER_STORAGE_KEY]: reorderMode,
    });
  } catch {
    // ignore
  }
};

const findCmsCollectionsHeader = (): HTMLElement | null => {
  const headers = document.querySelectorAll<HTMLElement>(
    PANEL_HEADER_SELECTOR
  );
  for (const header of Array.from(headers)) {
    const title = header.querySelector<HTMLElement>(
      PANE_TITLE_SELECTOR
    );
    if (
      title &&
      (title.textContent || "").trim() === "CMS Collections"
    ) {
      return header;
    }
  }
  return null;
};

const renderToggleStates = () => {
  document
    .querySelectorAll<HTMLElement>(`[${TOGGLE_ATTR}]`)
    .forEach((toggle) => {
      const circle = toggle.querySelector<SVGCircleElement>(
        `[${TOGGLE_CIRCLE_ATTR}]`
      );
      const bg = toggle.querySelector<SVGRectElement>(
        `[${TOGGLE_BG_ATTR}]`
      );
      if (reorderMode) {
        if (circle) {
          circle.setAttribute("cx", "10");
          circle.setAttribute("fill", "white");
        }
        if (bg) bg.setAttribute("opacity", "1");
      } else {
        if (circle) {
          circle.setAttribute("cx", "6");
          circle.setAttribute("fill", "currentColor");
        }
        if (bg) bg.setAttribute("opacity", "0");
      }
    });
};

const buildReorderBar = (): HTMLElement => {
  const bar = document.createElement("div");
  bar.setAttribute(TOGGLE_BAR_ATTR, "true");
  bar.setAttribute("ei-skip", "true");
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.justifyContent = "space-between";
  bar.style.padding = "6px 12px";
  bar.style.borderBottom =
    "1px solid var(--colors-border-secondary, rgba(255,255,255,0.08))";
  makeElMutationChangeSafe(bar);

  const label = document.createElement("span");
  label.textContent = "Reorder items";
  label.style.fontSize = "11.5px";
  label.style.color = "var(--colors-text-secondary)";
  label.style.userSelect = "none";
  makeElMutationChangeSafe(label);

  const toggle = document.createElement("div");
  toggle.setAttribute(TOGGLE_ATTR, "true");
  toggle.setAttribute("aria-hidden", "true");
  toggle.style.cursor = "pointer";
  toggle.style.display = "inline-flex";
  toggle.style.alignItems = "center";
  toggle.style.justifyContent = "center";
  toggle.style.width = "16px";
  toggle.style.height = "16px";
  toggle.style.color = "var(--colors-text-secondary)";
  toggle.style.transition = "color 120ms ease";
  toggle.innerHTML = `<svg data-wf-icon="FieldSwitchIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><g><rect ${TOGGLE_BG_ATTR}="true" x="2" y="4" width="12" height="8" rx="4" fill="var(--colors-action-primary-background)" opacity="0"/><circle ${TOGGLE_CIRCLE_ATTR}="true" cx="6" cy="8" r="2.5" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6 3C3.23858 3 1 5.23858 1 8C1 10.7614 3.23858 13 6 13H10C12.7614 13 15 10.7614 15 8C15 5.23858 12.7614 3 10 3H6ZM2 8C2 5.79086 3.79086 4 6 4H10C12.2091 4 14 5.79086 14 8C14 10.2091 12.2091 12 10 12H6C3.79086 12 2 10.2091 2 8Z" fill="currentColor"/></g></g></svg>`;
  makeElMutationChangeSafe(toggle);
  const svg = toggle.querySelector("svg");
  if (svg) makeElMutationChangeSafe(svg);
  const circle = toggle.querySelector("circle");
  if (circle) {
    makeElMutationChangeSafe(circle);
    circle.style.transition = "cx 120ms ease";
  }
  const bg = toggle.querySelector("rect");
  if (bg) {
    makeElMutationChangeSafe(bg);
    bg.style.transition = "opacity 120ms ease";
  }

  toggle.addEventListener("click", () => {
    reorderMode = !reorderMode;
    persistReorderMode();
    renderToggleStates();
    if (reorderMode) {
      undoGrouping();
    } else {
      groupCmsCollections();
    }
  });

  bar.appendChild(label);
  bar.appendChild(toggle);
  return bar;
};

const ensureReorderBar = () => {
  const header = findCmsCollectionsHeader();
  if (!header) return;
  const next = header.nextElementSibling;
  if (
    next instanceof HTMLElement &&
    next.hasAttribute(TOGGLE_BAR_ATTR)
  ) {
    return;
  }
  const bar = buildReorderBar();
  header.insertAdjacentElement("afterend", bar);
  renderToggleStates();
};

const undoGrouping = () => {
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
    .querySelectorAll<HTMLElement>(`[${LIST_ITEM_ATTR}]`)
    .forEach((item) => {
      restoreGroupText(item);
      item.removeAttribute(LIST_ITEM_ATTR);
      item.removeAttribute(GROUPED_ITEM_ATTR);
      item.setAttribute("draggable", "true");
      item.style.removeProperty("cursor");
    });
};

const removeReorderBar = () => {
  document
    .querySelectorAll<HTMLElement>(`[${TOGGLE_BAR_ATTR}]`)
    .forEach((el) => el.remove());
};

// Collection grouping is currently disabled. Webflow crashes when
// users delete a grouped collection or create a new one inside an
// existing group, because React's reconciliation can't reconcile
// against a DOM tree we've moved into a custom wrapper. Until we
// have a non-destructive approach, this function only ensures any
// stale group wrapper / reorder toggle is torn down — no new
// grouping happens.
export const groupCmsCollections = () => {
  undoGrouping();
  removeReorderBar();
};

// Keep the disabled grouping helpers referenced so they survive
// dead-code elimination at the type level. When grouping is
// re-enabled these become live again.
void debug;
void COLLECTION_SELECTOR;
void hydrateCollapsedGroups;
void cleanGroupText;
void installDragGuard;
void markAsListItem;
void buildCollectionGroupWrapper;
void observeParent;
void findExistingWrapper;
void hydrateReorderMode;
void ensureReorderBar;
