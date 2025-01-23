import { CONSTANTS } from "../config/config";
import { debug } from "../modules/debug";
import { CONFIG_NAMES } from "../modules/getEIConfig";

export type DESIGNER_MODE =
  | "page"
  | "inside_component"
  | "inside_config_component"
  | "unknown";

const _designerModeHistory: DESIGNER_MODE[] = ["unknown"];

let _listeners = new Set<(mode: DESIGNER_MODE) => void>();

let _fromToListeners = new Set<{
  fromMode: DESIGNER_MODE;
  toMode: DESIGNER_MODE;
  callback: (mode: DESIGNER_MODE) => void;
}>();

const addToDesignerModeHistory = (mode: DESIGNER_MODE) => {
  if (mode === getCurrentDesignerMode()) {
    return;
  }
  //add the mode to the history
  _designerModeHistory.push(mode);
  //if the history is longer than 10, remove the oldest mode
  if (_designerModeHistory.length > 10) {
    _designerModeHistory.shift();
  }
  if (isDesignerModeChanged()) {
    debug("🫵 Designer mode changed to", mode);
    //notify the listeners
    _listeners.forEach((listener) => listener(mode));
    const currentMode = getCurrentDesignerMode();
    const previousMode = getPreviousDesignerMode();
    _fromToListeners.forEach((listener) => {
      if (
        listener.fromMode === previousMode &&
        listener.toMode === currentMode
      ) {
        listener.callback(currentMode);
      }
    });
  }
};

export const getCurrentDesignerMode = () => {
  if (_designerModeHistory.length > 0) {
    return _designerModeHistory[
      _designerModeHistory.length - 1
    ];
  }
  return "unknown";
};

export const getPreviousDesignerMode = () => {
  if (_designerModeHistory.length > 1) {
    return _designerModeHistory[
      _designerModeHistory.length - 2
    ];
  }
  return "unknown";
};

const isDesignerModeChanged = () => {
  const currentMode = getCurrentDesignerMode();
  const previousMode = getPreviousDesignerMode();
  return currentMode !== previousMode;
};

const setDesignerMode = () => {
  if (
    document.querySelector(
      CONSTANTS.designerModeConfig.pageModeSelector
    )
  ) {
    addToDesignerModeHistory("page");
    return;
  }

  const componentHeader = document.querySelector(
    CONSTANTS.designerModeConfig.componentModeSelector
  );

  if (componentHeader) {
    const componentName = (
      componentHeader.textContent || ""
    )
      .toLocaleLowerCase()
      .trim();
    const isConfigComponent = CONFIG_NAMES.filter(
      (name) => name.toLowerCase() === componentName
    );
    if (isConfigComponent.length > 0) {
      addToDesignerModeHistory("inside_config_component");
      return;
    }
    addToDesignerModeHistory("inside_component");
    return;
  }

  addToDesignerModeHistory("unknown");
};

export const monitorDesignerMode = () => {
  setDesignerMode();
};

export const onDesignerModeChange = (
  callback: (mode: DESIGNER_MODE) => void
) => {
  _listeners.add(callback);
  callback(getCurrentDesignerMode());
  return () => {
    _listeners.delete(callback);
  };
};

export const onDesignerModeChangeFromTo = (
  fromMode: DESIGNER_MODE,
  toMode: DESIGNER_MODE,
  callback: (mode: DESIGNER_MODE) => void
) => {
  if (fromMode === toMode) {
    return;
  }
  const listener = { fromMode, toMode, callback };
  _fromToListeners.add(listener);
  return () => {
    _fromToListeners.delete(listener);
  };
};
