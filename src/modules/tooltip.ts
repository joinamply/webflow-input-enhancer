import tippy, { Props } from "tippy.js";
import "tippy.js/dist/tippy.css";

const style = document.createElement("style");
style.textContent = `
  .tippy-box {
    font-size: 11.5px;
    box-shadow: 0px 12px 24px 8px rgba(0, 0, 0, 0.08),0px 8px 16px 4px rgba(0, 0, 0, 0.08),0px 4px 8px 2px rgba(0, 0, 0, 0.08),0px 2px 6px 0px rgba(0, 0, 0, 0.08),0px -0.5px 0.5px 0px rgba(0, 0, 0, 0.12) inset,0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.12) inset;
    background-color: #404040;
    color: #fff;
    max-width: 180px !important;
  }
    .tippy-arrow {
      color: #404040;
    }
`;
document.head.appendChild(style);

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
