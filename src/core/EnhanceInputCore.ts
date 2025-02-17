import {
  getEIConfig,
  EIConfigValue,
} from "../modules/getEIConfig";
import { tooltip } from "../modules/tooltip";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import { inputTypes } from "./entry";

//mount input on type
export type mountInputOn = "focus" | "mount";

//config type
export type configType = {
  tooltip: string;
  customTooltip?: string;
  description?: string;
  selector: string[];
  icon?: string;
  mountInputOn?: mountInputOn;
  hideActualInput?: boolean;
  fieldConfig?: {
    id: string | null;
    configValues: EIConfigValue[] | null;
    toolTipConfig: string | null;
    inlineConfig: string[] | null;
    descriptionConfig: string | null;
  };
  getGlobalConfig?: typeof getEIConfig;
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
    let text =
      data.webflowField.cleanFieldName ||
      data.webflowField.fieldName;

    return text;
  };

  const defaultIconRenderer = (data: mountData) => {
    const { icon } = data.config;
    const iconElement = data.webflowField.getIconElement();
    if (data.config.description) {
      const sep =
        data.webflowField.element.parentElement!
          .previousElementSibling!;
      makeElMutationChangeSafe(sep);
      sep.innerHTML = data.config.description;
      sep.setAttribute("data-ei-desc", "true");
    }

    if (
      iconElement &&
      iconElement.parentElement &&
      iconElement.parentElement.parentElement
    ) {
      if (
        icon &&
        iconElement &&
        iconElement.outerHTML === icon
      ) {
        return;
      }
      makeElMutationChangeSafe(iconElement);
      makeElMutationChangeSafe(iconElement.parentElement);
      makeElMutationChangeSafe(
        iconElement.parentElement.parentElement
          .parentElement!
      );

      makeElMutationChangeSafe(
        iconElement.parentElement.parentElement
      );
      if (
        !(iconElement.parentElement.parentElement as any)
          .hasTippy
      ) {
        tooltip(iconElement.parentElement.parentElement, {
          content:
            data.config.customTooltip ||
            data.config.tooltip,
          placement: "left",
        });
        (
          iconElement.parentElement.parentElement as any
        ).hasTippy = true;
      }
    }
    if (icon && iconElement) {
      iconElement.outerHTML = icon;
    }
  };

  return {
    config: data.config,
    onMount: data.onMount,
    labelFactory: data.labelFactory || defaultLabelFactory,
    iconRenderer: data.iconRenderer || defaultIconRenderer,
  };
};
