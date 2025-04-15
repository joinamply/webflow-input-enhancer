import { createEnhanceInput } from "../core/EnhanceInputCore";

export const EIBlankInput = createEnhanceInput({
  config: {
    tooltip: "",
    selector: ["IE", "EI"],
    hideActualInput: false,
    mountInputOn: "mount",
  },
  onMount: ({ globalCleanUp }) => {
    return {
      destroy: () => {
        globalCleanUp?.();
      },
    };
  },
});
