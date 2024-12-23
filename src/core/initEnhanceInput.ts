import { EIClassInput } from "../EnhanceInputs/EIClass";
import { EIEmailInput } from "../EnhanceInputs/EIEmail";
import { EINumberInput } from "../EnhanceInputs/EINumber";
import { EIStyleInput } from "../EnhanceInputs/EIStyle";
import { debug } from "../modules/debug";
import { EnhanceInput } from "./EnhanceInputCore";
import { inputTypes, setIsDOMChanging } from "./entry";

//enhance inputs array
const enhanceInputs: EnhanceInput[] = [];

//register enhance inputs
enhanceInputs.push(EIStyleInput);
enhanceInputs.push(EIClassInput);
enhanceInputs.push(EINumberInput);
enhanceInputs.push(EIEmailInput);
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
    //get the eligible inputs
    const eligibleInputs = enhanceInputs.filter(
      (enhanceInput) => {
        const { config } = enhanceInput;
        const selector = config.selector;

        return selector.some((s) =>
          input.fieldName.includes(s)
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

        //mount the new input
        const mountReturn = finalInput.onMount({
          changeValue,
          webflowField: {
            ...input,
            value: _value,
          },
          config,
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
              input.getLabelElement()!.textContent =
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
