import { createEnhanceInput } from "../core/EnhanceInputCore";
import { createSuggestions } from "../modules/createSuggestions";
import { onWebflowClassNameChange } from "../modules/getAllWebflowClassName";
import { autoResizeTextarea } from "../utils/autoResizeTextarea";
import { iconList } from "../utils/iconList";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";

export const EIClassInput = createEnhanceInput({
  config: {
    tooltip: "Enter class name",
    selector: ["[Class]"],
    hideActualInput: true,
    mountInputOn: "focus",
    icon: iconList.cssClass,
  },
  onMount: ({
    webflowField,
    changeValue,
    globalCleanUp,
  }) => {
    let allWebflowClassName: string[] = [];

    //get the webflow field
    const { element, value, defaultDisplay } = webflowField;
    //get the parent element
    const parentEl = element.parentElement;
    //create the textarea element
    const textareaEl = document.createElement("textarea");
    //make the textarea element mutation change safe
    makeElMutationChangeSafe(textareaEl);
    //get the value
    const getValue = (value: string) => {
      return value
        .split(" ")
        .map((v) => v.trim())
        .join("\n");
    };
    //get the final value
    const getFinalValue = (value: string) => {
      return value.split("\n").join(" ");
    };
    //change value function
    const onChange = () => {
      changeValue(getFinalValue(textareaEl.value));
      //auto resize the textarea
      autoResizeTextarea(textareaEl);
    };
    //append the textarea to the parent element
    parentEl?.appendChild(textareaEl);
    //focus the textarea
    textareaEl.focus();
    //create the suggestions
    const suggestion = createSuggestions(
      textareaEl,
      allWebflowClassName,
      {},
      onChange,
      {
        keyPairSeparator: "",
      }
    );
    const unsubscribe = onWebflowClassNameChange(
      (classes) => {
        allWebflowClassName = classes;
        suggestion.updateKeys(allWebflowClassName, {});
      }
    );
    //destroy function
    const destroy = () => {
      textareaEl.removeEventListener("blur", destroy);
      textareaEl.removeEventListener("input", onChange);
      textareaEl.remove();
      suggestion.destroy();
      unsubscribe();
      globalCleanUp?.();
    };

    //set the value of the textarea
    textareaEl.value = getValue(value);
    //add the class names of the element to the textarea
    element.classList.forEach((className) => {
      textareaEl.classList.add(className);
    });
    //set the style of the textarea
    textareaEl.style.cssText = element.style.cssText;
    textareaEl.style.display = defaultDisplay;
    textareaEl.style.overflow = "hidden";
    textareaEl.style.resize = "none";
    textareaEl.style.width = "100%";
    //add the event listeners
    textareaEl.addEventListener("blur", destroy);
    //add the input event listener
    textareaEl.addEventListener("input", onChange);
    //auto resize the textarea
    autoResizeTextarea(textareaEl);
    //return the destroy function
    return { destroy };
  },
});
