const makeElMutationChangeSafe = (
  el: HTMLElement | SVGAElement | Element
) => {
  if (el) {
    (el as any).ieType = true;
  }
};

export default makeElMutationChangeSafe;
