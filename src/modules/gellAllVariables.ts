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
  let collection: { [key: string]: any } = {};
  if (!dom) return;

  if ("variableCollections" in dom) {
    const _variableCollections = [
      ...dom.variableCollections,
    ];
    if (Array.isArray(_variableCollections)) {
      _variableCollections.forEach((col: any) => {
        if ("id" in col) {
          collection[col.id] = col;
        }
      });
    }
  }
  if ("variables" in dom && Array.isArray(dom.variables)) {
    const variables = dom.variables;

    allVariables = [];
    variables.forEach((variable: any) => {
      if ("name" in variable) {
        const isDeleted =
          "deleted" in variable && variable.deleted;
        if (!isDeleted) {
          let prefix = "";

          if (
            "collectionId" in variable &&
            variable.collectionId in collection
          ) {
            const _collection =
              collection[variable.collectionId];
            if (!_collection.isDefault) {
              prefix = `_${sanitizeForVariableName(
                _collection.name
              )}`;
            }
          }
          allVariables.push(
            `var(--${prefix}${
              prefix ? "---" : ""
            }${sanitizeForVariableName(variable.name)})`
          );
        }
      }
    });

    listenerList.forEach((cb) => cb(allVariables));
  }
});
initVariablesFetch();
