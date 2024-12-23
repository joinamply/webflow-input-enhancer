import { createEnhanceInput } from "../core/EnhanceInputCore";
import { createSuggestions } from "../modules/createSuggestions";
import { autoResizeTextarea } from "../utils/autoResizeTextarea";
import { iconList } from "../utils/iconList";
import makeElMutationChangeSafe from "../utils/makeElMutationChangeSafe";
import {
  styleSuggestionMap,
  styleSuggestionMapKeys,
} from "../utils/styleSuggestionMap";

export const EIStyleInput = createEnhanceInput({
  config: {
    tooltip: "Enter inline CSS",
    selector: ["[Style]"],
    hideActualInput: true,
    mountInputOn: "focus",
    icon: iconList.style,
  },
  onMount: ({
    webflowField,
    changeValue,
    globalCleanUp,
  }) => {
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
        .split(";")
        .map((v) => v.trim())
        .join("\n");
    };
    //get the final value
    const getFinalValue = (value: string) => {
      return value
        .split("\n")
        .map((v) => v.trim().replace(";", ""))
        .join("; ");
    };
    //append the textarea to the parent element
    parentEl?.appendChild(textareaEl);
    //focus the textarea
    textareaEl.focus();
    //change value function
    const onChange = () => {
      changeValue(getFinalValue(textareaEl.value));
      //auto resize the textarea
      autoResizeTextarea(textareaEl);
    };
    //create the suggestions

    const suggestion = createSuggestions(
      textareaEl,
      styleSuggestionMapKeys,
      styleSuggestionMap,
      onChange,
      {
        keyPairSeparator: ":",
      }
    );
    //destroy function
    const destroy = () => {
      textareaEl.removeEventListener("blur", destroy);
      textareaEl.removeEventListener("input", onChange);
      textareaEl.remove();
      suggestion.destroy();
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

    return {
      destroy,
    };
  },
});
