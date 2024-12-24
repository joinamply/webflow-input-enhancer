import { debug } from "./debug";
import {
  fetchDomData,
  onDomDataChange,
} from "./fetchDomData";

let allWebflowClassName: string[] = [];
let isRunning = false;
const listenerList = new Set<(classes: string[]) => void>();
const fetchAllWebflowClassName = async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await fetchDomData();
  } catch (e) {
    debug(e);
  } finally {
    isRunning = false;
  }
};

export const initClassNameFetch = async () => {
  debug("Fetching all webflow class names 🚀");
  await fetchAllWebflowClassName();
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

onDomDataChange((dom) => {
  if (!dom) return;
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

    listenerList.forEach((cb) => cb(allWebflowClassName));
  }
});
initClassNameFetch();
