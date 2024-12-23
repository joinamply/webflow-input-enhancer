import { debug } from "./debug";
import { fetchDomData } from "./fetchDomData";

let allWebflowClassName: string[] = [];
let isRunning = false;
const listenerList = new Set<(classes: string[]) => void>();
const fetchAllWebflowClassName = () => {
  if (isRunning) return;
  isRunning = true;
  try {
    fetchDomData()
      .then((dom) => {
        if ("styles" in dom && "blocks" in dom.styles) {
          const blocks = dom.styles.blocks;
          if (Array.isArray(blocks)) {
            allWebflowClassName = [];
            blocks.forEach((block) => {
              if (
                "data" in block &&
                "name" in block.data &&
                "type" in block.data &&
                block.data.type === "class"
              ) {
                allWebflowClassName.push(block.data.name);
              }
            });
          }

          listenerList.forEach((cb) =>
            cb(allWebflowClassName)
          );
        }
      })
      .catch((e) => {
        debug(e);
      })
      .finally(() => {
        isRunning = false;
      });
  } catch (e) {
    debug(e);
  } finally {
    isRunning = false;
  }
};

export const initClassNameFetch = () => {
  fetchAllWebflowClassName();
  setInterval(fetchAllWebflowClassName, 1000 * 10);
};

export const onWebflowClassNameChange = (
  cb: (classes: string[]) => void
) => {
  const unsubscribe = () => {
    listenerList.delete(cb);
  };
  listenerList.add(cb);

  if (allWebflowClassName.length > 0) {
    cb(allWebflowClassName);
  }
  return unsubscribe;
};
