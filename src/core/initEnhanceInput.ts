import { EIClassInput } from "../EnhanceInputs/EIClass";
import { EIDropdownInput } from "../EnhanceInputs/EIDropdown";
import { EIEmailInput } from "../EnhanceInputs/EIEmail";
import { EINumberInput } from "../EnhanceInputs/EINumber";
import { EIStyleInput } from "../EnhanceInputs/EIStyle";

import { debug } from "../modules/debug";
import {
  getEIConfig,
  EIConfigValue,
} from "../modules/getEIConfig";
import { parseFieldName } from "../utils/parseFieldName";
import { EnhanceInput } from "./EnhanceInputCore";
import { inputTypes, setIsDOMChanging } from "./entry";

//enhance inputs array
const enhanceInputs: EnhanceInput[] = [];

//register enhance inputs
enhanceInputs.push(EIStyleInput);
enhanceInputs.push(EIClassInput);
enhanceInputs.push(EINumberInput);
enhanceInputs.push(EIEmailInput);
enhanceInputs.push(EIDropdownInput);
export const initEnhanceInput = (
  allPossibleInputs: inputTypes[]
) => {
  debug(
    "🔥 Initializing the enhance input",
    " | Visible Inputs",
    allPossibleInputs.map((input) => input.fieldName)
  );
  //destroy list
  const globalDestroyList = new Set<() => void>();

  allPossibleInputs.forEach((input) => {
    const parsedFieldName = parseFieldName(input.fieldName);
    input.cleanFieldName = parsedFieldName.name;
    if (parsedFieldName.id !== null) {
      input.hasConfigId = true;
      input.configId = parsedFieldName.id;
    }
    //get the eligible inputs
    const eligibleInputs = enhanceInputs.filter(
      (enhanceInput) => {
        if (!parsedFieldName.type) {
          return false;
        }
        const { config } = enhanceInput;
        const selector = config.selector;

        return (
          selector.filter((s) => s === parsedFieldName.type)
            .length > 0
        );
      }
    );
    //if the eligible inputs are found, mount the input
    if (eligibleInputs.length > 0) {
      //get the final input
      const finalInput = eligibleInputs[0];
      //get the config
      const config = finalInput.config;
      //init the value
      let _value = input.value;
      //get the value from the input
      _value = (input.element as HTMLInputElement).value;

      debug(
        "🔥 Initializing the enhance input",
        input.fieldName
      );

      const updateValue = () => {
        _value = (input.element as HTMLInputElement).value;
      };

      const changeValue = (value: string) => {
        (input.element as HTMLInputElement).value = value;
        (input.element as HTMLInputElement).dispatchEvent(
          new Event("input", { bubbles: true })
        );
        (input.element as HTMLInputElement).dispatchEvent(
          new Event("change", { bubbles: true })
        );
        updateValue();
      };
      let inScopeDestroyList = new Set<() => void>();

      const destroy = () => {
        setIsDOMChanging(true);
        inScopeDestroyList.forEach((destroy) => destroy());
        inScopeDestroyList.clear();
        setIsDOMChanging(false);
      };

      //mount the input
      const mountInput = (globalCleanUp?: () => void) => {
        //destroy the previous input
        destroy();
        //set the dom changing to true
        setIsDOMChanging(true);
        const globalConfig = getEIConfig();
        let _configValues: EIConfigValue[] | null = null;
        if (
          Object.keys(globalConfig).length &&
          typeof parsedFieldName.id === "string" &&
          parsedFieldName.id in globalConfig
        ) {
          debug(
            "🔥 Found global config for",
            parsedFieldName.id,
            globalConfig[parsedFieldName.id]
          );
          _configValues =
            globalConfig[parsedFieldName.id].value;
        }
        //mount the new input
        const mountReturn = finalInput.onMount({
          changeValue,
          webflowField: {
            ...input,
            value: _value,
          },
          config: {
            ...config,
            fieldConfig: {
              id: parsedFieldName.id,
              configValues: _configValues,
              inlineConfig: parsedFieldName.inlineConfig,
            },
            getGlobalConfig: getEIConfig,
          },
          globalCleanUp,
        });
        //add the destroy function to the destroy list
        globalDestroyList.add(mountReturn.destroy);
        //add the destroy function to the in scope destroy list
        inScopeDestroyList.add(mountReturn.destroy);
        //set the dom changing to false
        setIsDOMChanging(false);

        return mountReturn;
      };

      if (config.mountInputOn === "focus") {
        const mountOnFocus = () => {
          mountInput(() => {
            if (config.hideActualInput) {
              input.element.style.display =
                input.defaultDisplay;
            }
          });
          if (config.hideActualInput) {
            input.element.style.display = "none";
          }
        };

        //add the event listener to the input
        input.element.addEventListener(
          "focus",
          mountOnFocus
        );
        //add the destroy function to the in scope destroy list
        globalDestroyList.add(() => {
          input.element.removeEventListener(
            "focus",
            mountOnFocus
          );
        });
      } else if (config.mountInputOn === "mount") {
        const mountOnMount = () => {
          mountInput(() => {
            if (config.hideActualInput) {
              input.element.style.display =
                input.defaultDisplay;
            }
          });
          if (config.hideActualInput) {
            input.element.style.display = "none";
          }
        };
        //mount the input
        mountOnMount();
      }
      setIsDOMChanging(true);
      //render the icon
      const renderIcon = () => {
        if (
          finalInput.iconRenderer &&
          typeof finalInput.iconRenderer === "function"
        ) {
          finalInput.iconRenderer!({
            changeValue,
            webflowField: input,
            config,
          });
        }
      };

      const renderDestroyList = new Set<() => void>();

      //render the label
      const renderLabel = () => {
        renderDestroyList.forEach((destroy) => destroy());
        if (
          finalInput.labelFactory &&
          typeof finalInput.labelFactory === "function"
        ) {
          const changeLabel = () => {
            if (input.getLabelElement()) {
              const labelElement = input.getLabelElement()!;
              (labelElement as any).ieText =
                input.fieldName;
              labelElement.textContent =
                finalInput.labelFactory!({
                  changeValue,
                  webflowField: input,
                  config,
                });

              renderIcon();
            }
          };
          changeLabel();
        }
        if (input.getFieldLabelParent()) {
          const observer = new MutationObserver(
            (mutationList) => {
              //check if the dom is changing
              if ((window as any).isDOMChanging) {
                return;
              }
              if (mutationList && mutationList.length > 0) {
                //check if the mutation type is childList
                if (mutationList[0].type === "childList") {
                  //check if the mutation target has the ieType property
                  const isIEChange = mutationList.filter(
                    (m) =>
                      "ieType" in m.target &&
                      m.target.ieType === true
                  );
                  if (isIEChange.length > 0) {
                    renderLabel();
                    return;
                  }
                }
              }
            }
          );
          observer.observe(
            input.getFieldLabelParent()!.parentElement!,
            {
              childList: true,
              subtree: true,
            }
          );
          renderDestroyList.add(() => {
            observer.disconnect();
          });
        }
      };
      renderLabel();

      setIsDOMChanging(false);
    }
  });

  return {
    destroy: () => {
      debug("🔥 Destroying the enhance input");
      setIsDOMChanging(true);
      globalDestroyList.forEach((destroy) => destroy());
      setIsDOMChanging(false);
    },
  };
};
