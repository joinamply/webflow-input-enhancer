import { EIClassInput } from "../EnhanceInputs/EIClass";
import { EIStyleInput } from "../EnhanceInputs/EIStyle";
import { debug } from "../modules/debug";
import { EnhanceInput } from "./EnhanceInputCore";
import { inputTypes, setIsDOMChanging } from "./entry";

//enhance inputs array
const enhanceInputs: EnhanceInput[] = [];

//register enhance inputs
enhanceInputs.push(EIStyleInput);
enhanceInputs.push(EIClassInput);

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

      debug("🔥 Initializing the enhance input", {
        selector: config.selector,
        fieldName: input.fieldName,
      });

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
      //render the label
      if (
        finalInput.labelFactory &&
        typeof finalInput.labelFactory === "function"
      ) {
        input.labelElement.textContent =
          finalInput.labelFactory({
            changeValue,
            webflowField: input,
            config,
          });
      }

      //render the icon
      if (
        finalInput.iconRenderer &&
        typeof finalInput.iconRenderer === "function"
      ) {
        finalInput.iconRenderer({
          changeValue,
          webflowField: input,
          config,
        });
      }
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
