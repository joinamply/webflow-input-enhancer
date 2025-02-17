let _debug = false;

export const canDebug = () => {
  return _debug;
};

export const setDebug = (value: boolean) => {
  _debug = value;
};

export const CONSTANTS = {
  APP_NAME: "Webflow Input Enhancer",
  SIDEBAR_ID: "right-sidebar",
  COMPONENT_INSTANCE_TAB_ID: `[data-automation-id="componentInstanceProperties"]`,
  COMPONENT_INSTANCE_PROPERTY_TEXT: "Properties",
  LOGO: {
    INJECT_SELECTOR: "span[data-sc='Text']",
    ID: "#webflow-input-enhancer-logo",
    TITLE:
      "Properties are enhanced with Webflow Input Enhancer",
    ARIA_LABEL: "Webflow Input Enhancer",
    WIDTH: "16px",
    HEIGHT: "16px",
    MARGIN_RIGHT: "4px",
  },
  WEBFLOW_EDITOR_APP_ROOT_SELECTOR:
    "#designer-app-react-mount",
  WEBFLOW_EDITOR_APP_ROOT_SELECTOR_ALTERNATIVE: "body",
  FIELD_SELECTOR: "input[type='text'][data-automation-id]",
  TEXTAREA_FIELD_SELECTOR: "textarea[data-automation-id]",
  AUTOMATION_ID_KEY: "data-automation-id",
  PROP_EDITOR_SELECTOR: `[data-automation-id="PropsEditor"]`,
  ATTRIBUTE_CONTAINER_SELECTORS: {
    normal: `[data-automation-id="ExpressionEditor-fieldWrapper-Custom Attributes"]`,
    custom: `[data-automation-id="ExpressionEditor-fieldWrapper-Attributes"]`,
  },
  ATTRIBUTE_CREATOR_SELECTOR: {
    parent: `[data-automation-id="ExpressionEditor-fieldWrapper-"]`,
    name: `[data-automation-id="ExpressionEditor-fieldWrapper-name"]`,
    nameAlternative: `[data-automation-id="ExpressionEditor-fieldWrapper-Name"]`,
    nameInput: `[data-automation-id="Type--Plugin_Text"]`,
    nameInputAlternative: `[data-automation-id="Type--Plugin_Text_Name"]`,
    nameInnerText: `name`,
    value: `[data-automation-id="ExpressionEditor-fieldWrapper-value"]`,
    valueAlternative: `[data-automation-id="ExpressionEditor-fieldWrapper-Value"]`,
    valueInput: `[data-automation-id="Type--Plugin_Text"]`,
    valueInputAlternative: `[data-automation-id="Type--Plugin_Text_Value"]`,
    valueInnerText: `value`,
  },
  PROP_EDITOR_INPUT_SELECTOR: `input[data-automation-id="Type--Plugin_Text_Text"]`,
  safeAttrVals: ["property-list-item-action-wrapper"],
  PARENT_MATCHING_ELEMENTS_SELECTOR: {
    parent: `ExpressionEditor-fieldWrapper-`,
    separator: `expression-editor-override-label-separator`,
  },
  componentListSelector: `[data-automation-id="components-list-wrapper"]`,
  configComponentItemSelectors: [
    `[data-automation-id="symbol-panel-ie-config"]`,
    `[data-automation-id="symbol-panel-ieconfig"]`,
    `[data-automation-id="symbol-panel-ie-settings"]`,
  ],
  componentListCountSelectors: [
    `[data-automation-id="symbol-panel-ie-config-count"]`,
    `[data-automation-id="symbol-panel-ieconfig-count"]`,
    `[data-automation-id="symbol-panel-ie-settings-count"]`,
  ],
  globalSearchItemSelector: `[data-automation-id="finder-search-result-item"]`,
  globalSearchItemIconSelector: `[data-wf-icon="ElementComponentIcon"]`,
  designerModeConfig: {
    pageModeSelector: `[data-automation-id="top-bar-page-name"]`,
    componentModeSelector: `[data-automation-id="unfocus-component-button"]`,
    componentHeaderIconSelector: `[data-wf-icon="ElementComponentIcon"]`,
  },
};

export const FIELD_CONSTANTS = {
  TEXT_INPUT_PREFIX: "Type--Plugin_Text_",
  TEXT_INPUT_LIST_PREFIX: "Type--Plugin_List_",
  PARENT_PREFIX: "ExpressionEditor-fieldWrapper-",
  FIELD_LABEL_PREFIX: "Type--Label_",
};
