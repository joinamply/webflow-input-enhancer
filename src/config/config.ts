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
  AUTOMATION_ID_KEY: "data-automation-id",
};

export const FIELD_CONSTANTS = {
  TEXT_INPUT_PREFIX: "Type--Plugin_Text_",
  PARENT_PREFIX: "ExpressionEditor-fieldWrapper-",
  FIELD_LABEL_PREFIX: "Type--Label_",
};
