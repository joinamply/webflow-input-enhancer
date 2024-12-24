import { createEnhanceInput } from "../core/EnhanceInputCore";
import { iconList } from "../utils/assetList";

export const EINumberInput = createEnhanceInput({
  config: {
    tooltip: "Enter number",
    selector: ["Number"],
    hideActualInput: false,
    mountInputOn: "mount",
    icon: iconList.number,
  },
  onMount: ({ webflowField, globalCleanUp, config }) => {
    //get the webflow field
    const inlineConfig = config.fieldConfig?.inlineConfig;

    const { element } = webflowField;
    let field = element;
    if (element.type === "text") {
      element.type = "number";
      field = element;
      element.setAttribute("type", "number");
    } else {
      field = element.parentElement! as HTMLInputElement;
    }

    const validate = () => {
      const value = parseFloat(element.value);
      if (isNaN(value)) {
        field.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`;
        return;
      }

      const checkMin =
        inlineConfig &&
        inlineConfig.length >= 0 &&
        value < parseFloat(inlineConfig[0]);
      const checkMax =
        inlineConfig &&
        inlineConfig.length >= 1 &&
        value > parseFloat(inlineConfig[1]);
      if (checkMin || checkMax) {
        field.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`;
        return;
      }

      field.style.boxShadow = `var(--box-shadows-input-inner)`;
    };
    const resetOnFocus = () => {
      field.style.boxShadow = `var(--box-shadows-input-inner)`;
    };
    element.addEventListener("blur", validate);
    element.addEventListener("focus", resetOnFocus);
    if (inlineConfig) {
      if (inlineConfig.length >= 0) {
        element.setAttribute("min", inlineConfig[0]);
      }
      if (inlineConfig.length >= 1) {
        element.setAttribute("max", inlineConfig[1]);
      }
    }
    if (element.value.length) validate();
    //destroy function
    const destroy = () => {
      globalCleanUp?.();
      element.removeEventListener("blur", validate);
      element.removeEventListener("focus", resetOnFocus);
    };

    //return the destroy function
    return { destroy };
  },
});
