import { createEnhanceInput } from "../core/EnhanceInputCore";
import { iconList } from "../utils/assetList";

export const EINumberInput = createEnhanceInput({
  config: {
    tooltip: "Enter number",
    selector: ["[Number]"],
    hideActualInput: false,
    mountInputOn: "mount",
    icon: iconList.number,
  },
  onMount: ({ webflowField, globalCleanUp }) => {
    //get the webflow field
    const { element } = webflowField;
    element.type = "number";
    element.setAttribute("type", "number");

    //destroy function
    const destroy = () => {
      globalCleanUp?.();
    };

    //return the destroy function
    return { destroy };
  },
});
