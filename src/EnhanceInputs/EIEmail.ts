import { createEnhanceInput } from "../core/EnhanceInputCore";
import { iconList } from "../utils/assetList";
import { isValidEmail } from "../utils/isValidEmail";

export const EIEmailInput = createEnhanceInput({
  config: {
    tooltip: "Enter email",
    selector: ["[Email]"],
    hideActualInput: false,
    mountInputOn: "mount",
    icon: iconList.email,
  },
  onMount: ({ webflowField, globalCleanUp }) => {
    //get the webflow field
    const { element } = webflowField;
    if (element.type === "text") element.type = "email";
    element.setAttribute("type", "email");
    const validateOnInput = () => {
      if (element.value.length === 0) return;
      console.log(element.validity.valid, "valid");
      //if the value is not an email add error css
      const isValid = isValidEmail(element.value);
      if (!isValid) {
        element.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`;
      } else {
        element.style.boxShadow = `var(--box-shadows-input-inner)`;
      }
    };
    const resetOnFocus = () => {
      element.style.boxShadow = `var(--box-shadows-input-inner)`;
    };
    element.addEventListener("blur", validateOnInput);
    element.addEventListener("focus", resetOnFocus);
    if (element.value.length) validateOnInput();
    //destroy function
    const destroy = () => {
      globalCleanUp?.();
      element.removeEventListener("blur", validateOnInput);
      element.removeEventListener("focus", resetOnFocus);
    };

    //return the destroy function
    return { destroy };
  },
});
