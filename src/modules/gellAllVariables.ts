import { sanitizeForVariableName } from "../utils/sanitizeForVariableName";
import { debug } from "./debug";
import {
  fetchDomData,
  onDomDataChange,
} from "./fetchDomData";

let allVariables: string[] = [];

let isRunning = false;
const listenerList = new Set<(classes: string[]) => void>();

const fetchAllVariables = async () => {
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

export const initVariablesFetch = async () => {
  debug("Fetching all variables 🚀");
  await fetchAllVariables();
};

export const onVariablesChange = (
  cb: (variables: string[]) => void
) => {
  const unsubscribe = () => {
    listenerList.delete(cb);
  };
  listenerList.add(cb);

  if (allVariables.length > 0) {
    cb(allVariables);
  }
  return unsubscribe;
};

onDomDataChange((dom) => {
  if (!dom) return;
  if ("variables" in dom && Array.isArray(dom.variables)) {
    const variables = dom.variables;

    allVariables = [];
    variables.forEach((variable: any) => {
      if ("name" in variable) {
        const isDeleted =
          "deleted" in variable && variable.deleted;
        if (!isDeleted) {
          allVariables.push(
            `var(--${sanitizeForVariableName(
              variable.name
            )})`
          );
        }
      }
    });

    listenerList.forEach((cb) => cb(allVariables));
  }
});
initVariablesFetch();
