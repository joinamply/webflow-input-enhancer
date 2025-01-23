import { CONSTANTS } from "../config/config";
import {
  CONFIG_NAMES,
  getEIConfig,
} from "../modules/getEIConfig";
import { tooltip } from "../modules/tooltip";
import { createNotification } from "../utils/createNotification";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { onDesignerModeChange } from "./monitorDesignerMode";

let _listeners = new Set<() => void>();

export const locateConfigComponentItem = () => {
  _listeners.forEach((cb) => cb());
  _listeners.clear();
  const list = document.querySelector(
    CONSTANTS.componentListSelector
  );
  if (list) {
    const configItems =
      CONSTANTS.configComponentItemSelectors
        .map((selector) => list.querySelector(selector))
        .filter((d) => d);

    if (configItems.length > 0 && configItems[0]) {
      const configItem = configItems[0] as HTMLElement;

      const svg = configItem.querySelector("svg");
      if (svg) {
        makeElMutationChangeSafe(svg);
        const svgParent = svg.parentElement;
        if (svgParent) {
          makeElMutationChangeSafe(svgParent);
          svgParent.setAttribute("ei-config-item", "true");

          if (!svgParent.hasAttribute("ei-tooltip")) {
            tooltip(configItem, {
              content:
                "Webflow Input Enhancer config (component)",
            });
            svgParent.setAttribute("ei-tooltip", "true");
          }
        }

        const countEls =
          CONSTANTS.componentListCountSelectors
            .map((selector) =>
              configItem.querySelector(selector)
            )
            .filter((d) => d);

        if (countEls.length > 0 && countEls[0]) {
          const countEl = countEls[0] as HTMLElement;
          const textSpan = countEl.querySelector("span");
          if (textSpan) {
            makeElMutationChangeSafe(
              textSpan as HTMLElement
            );
            textSpan.setAttribute("ei-skip", "true");
            const text = textSpan.textContent || "";
            const startText = text.split("(")[0].trim();
            const count = Object.keys(getEIConfig()).length;
            const textToSet = `${startText} 
            \n(${count} IE Config Found)`;
            if (textToSet !== text) {
              textSpan.textContent = textToSet;
            }
          }
        }
      }
    }
  }

  const globalSearchItem = document.querySelectorAll(
    CONSTANTS.globalSearchItemSelector
  );

  if (globalSearchItem.length > 0) {
    const items = Array.from(globalSearchItem).filter(
      (item) => {
        const text = (item.textContent || "")
          .trim()
          .toLowerCase()
          .replace(" (component)", "");

        return (
          CONFIG_NAMES.filter(
            (name) => name.toLocaleLowerCase() === text
          ).length > 0
        );
      }
    );

    if (items.length > 0 && items[0]) {
      const item = items[0] as HTMLElement;
      const icon = item.querySelector(
        CONSTANTS.globalSearchItemIconSelector
      );
      if (icon) {
        makeElMutationChangeSafe(icon as HTMLElement);
        const iconParent = icon.parentElement;
        if (iconParent) {
          makeElMutationChangeSafe(iconParent);
          iconParent.setAttribute(
            "ei-config-search-item",
            "true"
          );
          if (!iconParent.hasAttribute("ei-tooltip")) {
            tooltip(item!, {
              content:
                "Webflow Input Enhancer config (component)",
              placement: "bottom-start",
            });
            iconParent.setAttribute("ei-tooltip", "true");
          }
        }
      }
    }
  }

  const unsubscribe = onDesignerModeChange((mode) => {
    if (mode === "inside_config_component") {
      const headerSelector = document.querySelector(
        CONSTANTS.designerModeConfig.componentModeSelector
      );

      if (headerSelector) {
        const icon = headerSelector.querySelector(
          CONSTANTS.designerModeConfig
            .componentHeaderIconSelector
        );

        if (icon) {
          icon.setAttribute(
            "ei-config-header-icon",
            "true"
          );
          if (!icon.hasAttribute("ei-tooltip")) {
            tooltip(headerSelector as HTMLElement, {
              content:
                "Webflow Input Enhancer config (component)",
            });
            icon.setAttribute("ei-tooltip", "true");
            createNotification(
              "Webflow Input Enhancer",
              "For the best experience, please wait for the changes to save after completing the configuration before leaving the component.",
              7000
            );
          }
        }
      }
    }
  });

  _listeners.add(() => {
    unsubscribe();
  });
};
