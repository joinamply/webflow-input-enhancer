import "./core.css";
import { debug } from "../modules/debug";
import {
  CONSTANTS,
  FIELD_CONSTANTS,
} from "../config/config";
import { initEnhanceInput } from "./initEnhanceInput";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { tooltip } from "../modules/tooltip";
import { LogoDataUrl } from "../utils/assetList";
import { fetchDomData } from "../modules/fetchDomData";

import { safeMutationRecordCheck } from "../utils/safeMutationRecordCheck";
import { findAllParentElements } from "../utils/findAllParentElements";

import { locatePropCreator } from "./locatePropCreator";
import { locateConfigComponentItem } from "./locateConfigComponentItem";
import {
  monitorDesignerMode,
  onDesignerModeChangeFromTo,
} from "./monitorDesignerMode";
import { createNotification } from "../utils/createNotification";
import { addIEFlagToCanvas } from "./addIEFlagToCanvas";
import { locateAttrContainer } from "./enhanceAttr";

(window as any).isDOMChanging = false;

export const setIsDOMChanging = (value: boolean) => {
  (window as any).isDOMChanging = value;
  //debug("🫵 DOM changing set to", value);
};

//storing the sidebar element in memory
let _sidebar: HTMLElement | null = null;

//list of observers will be used to monitor the sidebar changes
const rootObserverList: MutationObserver[] = [];

//list of observers will be used to monitor the alternative webflow editor app root changes
const alternativeRootObserverList: MutationObserver[] = [];

//list of observers will be used to monitor the component instance tab changes
const sidebarObserverList: MutationObserver[] = [];

//list of enhance inputs
const enhanceInputs: ReturnType<typeof initEnhanceInput>[] =
  [];

//monitor the sidebar changes
const monitorSidebar = () => {
  const sidebar = document.getElementById(
    CONSTANTS.SIDEBAR_ID
  );

  //if the sidebar is not the same as the one in memory, reinitialize the process
  if (sidebar !== _sidebar) {
    debug(
      "🙀 Oh no! Sidebar changed, reinitializing the process..."
    );
    locateSidebar();
  }
};

//locate the webflow editor app root element, this will help us to monitor the sidebar changes
const monitorWebflowEditorAppRoot = () => {
  //locate the webflow editor app root element
  const webflowEditorAppRoot =
    document.querySelector(
      CONSTANTS.WEBFLOW_EDITOR_APP_ROOT_SELECTOR
    ) ||
    document.querySelector(
      CONSTANTS.WEBFLOW_EDITOR_APP_ROOT_SELECTOR_ALTERNATIVE
    );
  if (webflowEditorAppRoot) {
    //monitor the sidebar changes
    const observer = new MutationObserver(monitorSidebar);
    observer.observe(webflowEditorAppRoot, {
      childList: true,
      subtree: true,
    });
    rootObserverList.push(observer);
  } else {
    debug(
      "Webflow Editor App Root not found, going YOLO! 🚀"
    );
  }
};

//monitor the sidebar changes, this will help us to reinitialize the process when the sidebar changes
const monitorSidebarChanges = () => {
  //watch for the component instance tab
  if (_sidebar) {
    const observer = new MutationObserver(
      watchForComponentInstanceTab
    );
    observer.observe(_sidebar, {
      childList: true,
      subtree: true,
    });
    sidebarObserverList.push(observer);
  }
};

//get the element to inject the logo
const getElementToInjectLogo = (
  parentElement: HTMLElement
) => {
  const elements = parentElement.querySelectorAll(
    CONSTANTS.LOGO.INJECT_SELECTOR
  );
  if (elements.length > 0) {
    const allElements = Array.from(elements);
    const textElements = allElements.filter((element) =>
      element.textContent?.includes(
        CONSTANTS.COMPONENT_INSTANCE_PROPERTY_TEXT
      )
    );
    return textElements[0].parentElement;
  }
  return null;
};

//inject the app logo
const injectAppLogo = (parentElement: HTMLElement) => {
  //get the element to inject the logo
  const elementToInjectLogo =
    getElementToInjectLogo(parentElement);
  if (elementToInjectLogo) {
    //check if the element already has a logo
    const existingLogo = elementToInjectLogo.querySelector(
      CONSTANTS.LOGO.ID
    );
    if (existingLogo) {
      return;
    }
    //set the display to flex
    elementToInjectLogo.style.display = "flex";
    elementToInjectLogo.style.alignItems = "center";

    //create the logo element
    const logo = document.createElement("img");
    logo.src = LogoDataUrl;
    logo.setAttribute(
      "id",
      CONSTANTS.LOGO.ID.replace("#", "")
    );
    logo.alt = CONSTANTS.LOGO.ARIA_LABEL;
    logo.style.width = CONSTANTS.LOGO.WIDTH;
    logo.style.height = CONSTANTS.LOGO.HEIGHT;
    logo.style.marginRight = CONSTANTS.LOGO.MARGIN_RIGHT;
    logo.ariaLabel = CONSTANTS.LOGO.ARIA_LABEL;
    logo.title = CONSTANTS.LOGO.TITLE;
    //prepend the logo to the element
    elementToInjectLogo.prepend(logo);
    //init the tooltip
    tooltip(logo.parentElement!, {
      content: CONSTANTS.LOGO.TITLE,
      placement: "bottom",
    });
  } else {
    debug(
      "🙀 Element to inject logo not found, we can still work without it!"
    );
  }
};

const getSafeSelector = (selector: string) => {
  const symbolMap = {
    "'": "&#39;",
    "`": "&#96;",
    // Add more symbols if needed
  };

  return selector.replace(
    /[\"'`<>&\/\\:; ]/g,
    (char) => (symbolMap as any)[char] || char
  );
};

//get the parent element of the input
const getInputParentElement = (
  element:
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLElement,
  name: string,
  depth: number = 5
) => {
  if (depth === 0) {
    return element;
  }
  const parent = element.parentElement;

  if (!parent) {
    return null;
  }

  if (
    parent.getAttribute(CONSTANTS.AUTOMATION_ID_KEY) ===
    FIELD_CONSTANTS.PARENT_PREFIX + name
  ) {
    return parent;
  }

  return getInputParentElement(parent, name, depth - 1);
};

export type inputTypes = {
  element: HTMLInputElement;
  automationId: string;
  fieldName: string;
  parentElement: Element;
  fieldLabelParent: Element;
  labelElement: ChildNode;
  iconElement: SVGSVGElement;
  value: string;
  defaultDisplay: string;
  getFieldLabelParent: () => Element | null;
  getLabelElement: () => ChildNode | null;
  getIconElement: () => SVGSVGElement | null;
  hasConfigId?: boolean;
  configId?: string;
  cleanFieldName?: string;
};

//get all possible inputs on component instance tab
const getAllPossibleInputs = (
  element: HTMLElement
): inputTypes[] => {
  //get all possible inputs
  const inputs = Array.from([
    ...element.querySelectorAll<HTMLElement>(
      CONSTANTS.FIELD_SELECTOR
    ),
    ...element.querySelectorAll<HTMLElement>(
      CONSTANTS.TEXTAREA_FIELD_SELECTOR
    ),
  ])
    .filter((input) => {
      //get the id
      const id = input.getAttribute(
        CONSTANTS.AUTOMATION_ID_KEY
      );
      //check if the id is not null
      if (!id) {
        debug("🙀 Input Id not found", input);
        return false;
      }

      //check if the id includes the text input type
      if (id.includes(FIELD_CONSTANTS.TEXT_INPUT_PREFIX)) {
        return true;
      } else if (
        id.includes(FIELD_CONSTANTS.TEXT_INPUT_LIST_PREFIX)
      ) {
        return true;
      }
      return false;
    })
    .map((input) => {
      //get key the to replace string
      const toReplace = input
        .getAttribute(CONSTANTS.AUTOMATION_ID_KEY)!
        .includes(FIELD_CONSTANTS.TEXT_INPUT_LIST_PREFIX)
        ? FIELD_CONSTANTS.TEXT_INPUT_LIST_PREFIX
        : FIELD_CONSTANTS.TEXT_INPUT_PREFIX;
      //get the default display
      const defaultDisplay = (
        input.style.display || "block"
      ).toString();
      //make the input mutation change safe
      makeElMutationChangeSafe(input);
      //make the parent element mutation change safe
      makeElMutationChangeSafe(input.parentElement!);
      //get the field name
      const fieldName =
        input
          .getAttribute(CONSTANTS.AUTOMATION_ID_KEY)
          ?.replace(toReplace, "") || "";

      //get the parent element
      let parentElement = getInputParentElement(
        input,
        fieldName
      );

      if (!parentElement) {
        debug("🙀 Parent element not found", input);
        return null;
      }
      //make the parent element mutation change safe
      makeElMutationChangeSafe(parentElement!);
      //get the field label parent
      const getFieldLabelParent = () => {
        let _parentElement = getInputParentElement(
          input,
          fieldName
        )!;
        if (_parentElement)
          makeElMutationChangeSafe(_parentElement);
        const fieldLabelParent =
          _parentElement.querySelector(
            `[data-automation-id='${
              FIELD_CONSTANTS.FIELD_LABEL_PREFIX
            }${getSafeSelector(fieldName)}']`
          );
        if (fieldLabelParent) {
          makeElMutationChangeSafe(fieldLabelParent);
        }
        return fieldLabelParent;
      };
      const fieldLabelParent = getFieldLabelParent();

      //if the field label parent is not found, return null
      if (!fieldLabelParent) {
        debug("🙀 Field label parent not found", input);
        return null;
      }
      //make the field label parent mutation change safe
      makeElMutationChangeSafe(fieldLabelParent!);
      //get the label element
      const getLabelElement = () => {
        const labelElement = Array.from(
          getFieldLabelParent()!.childNodes
        ).filter(
          (child) =>
            (child.nodeType === Node.TEXT_NODE &&
              child.textContent?.trim() === fieldName) ||
            (child as any).ieText === fieldName
        )[0];
        if (labelElement) {
          makeElMutationChangeSafe(
            labelElement as HTMLElement
          );
        }

        return labelElement;
      };

      const labelElement = getLabelElement();

      //make the label element mutation change safe
      makeElMutationChangeSafe(labelElement as HTMLElement);

      //if the label element is not found, return null
      if (!labelElement) {
        debug(
          "🙀 Label element not found",
          input,
          labelElement,
          fieldLabelParent,
          parentElement
        );
        return null;
      }

      (labelElement as any).ieText = fieldName;

      const getIconElement = () => {
        const icon =
          getFieldLabelParent()!.querySelector("svg");
        if (icon) {
          makeElMutationChangeSafe(icon);
        }
        return icon;
      };
      const iconElement = getIconElement();

      //if the icon element is not found, return null
      if (!iconElement) {
        debug("🙀 Icon element not found", input);
        return null;
      }
      //make the icon element mutation change safe
      makeElMutationChangeSafe(iconElement!);

      return {
        element: input as HTMLInputElement,
        automationId: input.getAttribute(
          CONSTANTS.AUTOMATION_ID_KEY
        )!,
        fieldName,
        parentElement,
        fieldLabelParent,
        labelElement,
        iconElement,
        value: (input as HTMLInputElement).value,
        defaultDisplay,
        getFieldLabelParent,
        getLabelElement,
        getIconElement,
      };
    })
    .filter((input) => input !== null);
  return inputs;
};

//watch for the component instance tab
const watchForComponentInstanceTab = (
  mutationList?: MutationRecord[],
  _?: MutationObserver
) => {
  //check if the dom is changing
  if ((window as any).isDOMChanging) {
    return;
  }
  //check if the mutation list is not null and has length
  if (mutationList && mutationList.length > 0) {
    //check if the mutation type is childList
    if (mutationList[0].type === "childList") {
      //check if the mutation target has the ieType property
      const isIEChange = mutationList.filter((m) =>
        safeMutationRecordCheck(m)
      );
      if (isIEChange.length > 0) {
        // debug(
        //   "🫵 EI Change detected, skipping the process...",
        //   mutationList,
        //   mutationList[0]
        // );
        return;
      }
    }
  }
  debug(
    "🫵 DOM change detected, reinitializing the process...",
    mutationList
  );
  //clear the observer list
  sidebarObserverList.forEach((observer) => {
    observer.disconnect();
  });
  sidebarObserverList.length = 0;
  //clear the enhance inputs
  enhanceInputs.forEach((input) => input.destroy());
  enhanceInputs.length = 0;

  if (_sidebar) {
    const componentInstanceTab =
      _sidebar.querySelector<HTMLElement>(
        CONSTANTS.COMPONENT_INSTANCE_TAB_ID
      );
    //if the component instance tab is found, enhance the inputs
    if (componentInstanceTab) {
      fetchDomData();
      debug("✅ Component Instance Tab found");
      //inject the app logo
      injectAppLogo(componentInstanceTab);
      //skip all parent elements from the mutation observer
      const parentElements = findAllParentElements(
        componentInstanceTab
      );
      parentElements.forEach((parent) => {
        parent.setAttribute("ei-skip", "true");
      });

      //get all possible inputs
      const allPossibleInputs = getAllPossibleInputs(
        componentInstanceTab
      );
      //initialize the enhance inputs
      const enhanceInput = initEnhanceInput(
        allPossibleInputs
      );
      enhanceInputs.push(enhanceInput);
    } else {
      debug(
        "🙀 Component Instance Tab not found, waiting for it..."
      );
    }

    //monitor the sidebar changes
    monitorSidebarChanges();
  }
};

//locate the sidebar element
const locateSidebar = () => {
  //clear the observer list
  rootObserverList.forEach((observer) => {
    observer.disconnect();
  });
  rootObserverList.length = 0;

  const sidebar = document.getElementById(
    CONSTANTS.SIDEBAR_ID
  );
  //if found
  if (sidebar) {
    debug("✅ Sidebar found, initializing the process...");
    //store the sidebar element in memory
    _sidebar = sidebar;

    //watch for the component instance tab
    watchForComponentInstanceTab();

    //monitor the webflow editor app root element
    monitorWebflowEditorAppRoot();
  } else {
    //if not found, wait for 100ms and try again
    setTimeout(locateSidebar, 100);
  }
};

const monitorAlternativeRoot = () => {
  //clear the observer list
  alternativeRootObserverList.forEach((observer) => {
    observer.disconnect();
  });
  alternativeRootObserverList.length = 0;
  const webflowEditorAppRoot =
    document.querySelector(
      CONSTANTS.WEBFLOW_EDITOR_APP_ROOT_SELECTOR
    ) ||
    document.querySelector(
      CONSTANTS.WEBFLOW_EDITOR_APP_ROOT_SELECTOR_ALTERNATIVE
    );

  if (webflowEditorAppRoot) {
    //monitor the sidebar changes
    const observer = new MutationObserver(
      (mutationList) => {
        //add the ie flag to the canvas
        addIEFlagToCanvas();
        //monitor the designer mode
        monitorDesignerMode();
        //check if the mutation is safe
        const isIEChange = mutationList.filter((m) =>
          safeMutationRecordCheck(m)
        );
        if (isIEChange.length > 0) {
          // debug(
          //   "🫵 EI Change detected for alternative root, skipping the process...",
          //   mutationList,
          //   mutationList[0]
          // );
          return;
        } else {
          //locate the config component item
          locateConfigComponentItem();
          locatePropCreator();
          locateAttrContainer();
        }
      }
    );
    observer.observe(webflowEditorAppRoot, {
      childList: true,
      subtree: true,
    });
    alternativeRootObserverList.push(observer);
  } else {
    //if not found, wait for 100ms and try again
    setTimeout(monitorAlternativeRoot, 100);
  }
};

//start the process, initialize the app
export const initApp = () => {
  //locate the sidebar
  locateSidebar();
  //locate the prop creator
  locatePropCreator();
  //monitor the alternative root
  monitorAlternativeRoot();
  //locate the config component item
  locateConfigComponentItem();
  //monitor the designer mode
  monitorDesignerMode();
  //listen for the designer mode change
  //locate the attribute container
  locateAttrContainer();
  setTimeout(() => {
    onDesignerModeChangeFromTo(
      "inside_config_component",
      "page",
      () => {
        fetchDomData();
      }
    );
  }, 1000);
  setTimeout(() => {
    createNotification(
      "Webflow Input Enhancer is ready!",
      null
    );
  }, 4000);
};
