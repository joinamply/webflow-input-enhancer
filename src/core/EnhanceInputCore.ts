import { tooltip } from "../modules/tooltip";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { inputTypes } from "./entry";

//mount input on type
export type mountInputOn = "focus" | "mount";

//config type
export type configType = {
  tooltip: string;
  selector: string[];
  icon?: string;
  mountInputOn?: mountInputOn;
  hideActualInput?: boolean;
};

//mount data type
export type mountData = {
  changeValue: (value: string) => void;
  webflowField: inputTypes;
  config: configType;
  globalCleanUp?: () => void;
};

//mount return type
export type mountReturn = {
  destroy: () => void;
};

//mount type
export type mountType = (data: mountData) => mountReturn;

//enhance input type
export type EnhanceInput = {
  config: configType;
  onMount: mountType;
  labelFactory?: (data: mountData) => string;
  iconRenderer?: (data: mountData) => void;
};

//create an enhance input
export const createEnhanceInput = (data: {
  config: configType;
  onMount: mountType;
  labelFactory?: (data: mountData) => string;
  iconRenderer?: (data: mountData) => void;
}) => {
  const defaultLabelFactory = (data: mountData) => {
    const { selector } = data.config;
    let text = data.webflowField.fieldName;
    selector.forEach((s) => {
      text = text.replace(s, "");
    });
    return text;
  };

  const defaultIconRenderer = (data: mountData) => {
    const { icon } = data.config;
    if (
      data.webflowField.iconElement &&
      data.webflowField.iconElement.parentElement &&
      data.webflowField.iconElement.parentElement
        .parentElement
    ) {
      makeElMutationChangeSafe(
        data.webflowField.iconElement.parentElement
          .parentElement.parentElement!
      );
      makeElMutationChangeSafe(
        data.webflowField.iconElement.parentElement
          .parentElement
      );
      tooltip(
        data.webflowField.iconElement.parentElement
          .parentElement,
        {
          content: data.config.tooltip,
          placement: "left",
        }
      );
    }
    if (icon && data.webflowField.iconElement) {
      data.webflowField.iconElement.outerHTML = icon;
    }
    console.log("iconElement");
  };

  return {
    config: data.config,
    onMount: data.onMount,
    labelFactory: data.labelFactory || defaultLabelFactory,
    iconRenderer: data.iconRenderer || defaultIconRenderer,
  };
};
