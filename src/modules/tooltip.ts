import tippy, { Props } from "tippy.js";
import "tippy.js/dist/tippy.css";

export const tooltip = (
  element: HTMLElement,
  props: Partial<Props> = {}
) => {
  return tippy(element, {
    placement: "bottom-start",
    offset: (props) => {
      const { placement } = props;
      if (placement.includes("bottom")) {
        return [10, 0];
      } else if (placement.includes("top")) {
        return [-10, 0];
      } else if (placement.includes("left")) {
        return [0, -30];
      } else if (placement.includes("right")) {
        return [0, 30];
      }
      return [0, 0];
    },
    popperOptions: {
      modifiers: [
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "window",
          },
        },
      ],
    },
    ...props,
  });
};
