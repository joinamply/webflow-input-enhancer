import { createEnhanceInput } from "../core/EnhanceInputCore";
import attachCustomDropdown from "../modules/attachCustomDropdown";
import { iconList } from "../utils/assetList";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

export const EIDropdownInput = createEnhanceInput({
  config: {
    tooltip: "Choose option",
    selector: ["Dropdown"],
    hideActualInput: true,
    mountInputOn: "mount",
    icon: iconList.dropdown,
  },
  onMount: ({
    changeValue,
    webflowField,
    globalCleanUp,
    config,
  }) => {
    //get the webflow field
    const { element } = webflowField;
    const { fieldConfig } = config;
    const parent = element.parentElement! as HTMLDivElement;
    makeElMutationChangeSafe(parent);

    const dropdown = attachCustomDropdown(
      parent!,
      fieldConfig?.configValues || [],
      element.value
    );
    dropdown.onChange((value) => {
      if (value) {
        changeValue(value.value);
      } else {
        changeValue("");
      }
    });
    const onInputElChange = () => {
      if (element.value) {
        dropdown.setValue(element.value);
      } else {
        dropdown.setValue("");
      }
    };
    const observer = new MutationObserver(onInputElChange);
    observer.observe(element, {
      childList: true,
      attributes: true,
    });

    return {
      destroy: () => {
        dropdown.destroy();
        globalCleanUp?.();
        observer.disconnect();
      },
    };
  },
});
