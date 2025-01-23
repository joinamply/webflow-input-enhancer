import { debug } from "./debug";
import { onDomDataChange } from "./fetchDomData";
export type EIConfigValue = { key: string; value: string };
const _listeners = new Set<
  (
    config: Record<string, { value: EIConfigValue[] }>
  ) => void
>();
let _lastConfig: Record<
  string,
  { value: EIConfigValue[] }
> = {};
type JSONItem = {
  _id: string;
  type: string;
  tag: string;
  classes: string[];
  children: string[];
  data: {
    tag?: string;
    text?: boolean;
    sym?: {
      root?: boolean;
      name?: string;
      groupName?: string;
      copies?: Record<string, number>;
    };
    xattr?: Array<{ name: string; value: string }>;
  };
  text?: boolean;
  v?: string;
};

export const CONFIG_NAMES = [
  "[EIConfig]",
  "[IEConfig]",
  "IEConfig",
  "IE_Config",
  "IE-Config",
  "IE Config",
  "IE_Settings",
  "IE-Settings",
  "IE Settings",
];

function generateTree(jsonData: JSONItem[]): any {
  const idMap = new Map<string, JSONItem>();

  // Build a map for easy lookup by ID
  jsonData.forEach((item) => {
    idMap.set(item._id, item);
  });

  // Function to recursively build the tree
  function buildTree(itemId: string): any {
    const item = idMap.get(itemId);
    if (!item) return null;

    return {
      id: item._id,
      type: item.type,
      tag: item.tag,
      text: item.text ? item.v : undefined,
      xattr: item.data?.xattr || [],
      children: item.children
        ? item.children
            .map((childId) => buildTree(childId))
            .filter(Boolean)
        : [],
    };
  }

  // Find the root item with sym.name = CONFIG_NAME
  const rootItem = jsonData.find((item) =>
    CONFIG_NAMES.includes(item.data?.sym?.name ?? "")
  );

  if (!rootItem) {
    debug(
      `📦 Component config not found with sym.name = ${CONFIG_NAMES.join(
        " or "
      )}`
    );
    return {};
  }

  // Build and return the tree starting from the root
  return buildTree(rootItem._id);
}

function extractTextByIeId(
  tree: any
): Record<string, { value: EIConfigValue[] }> {
  const result: Record<string, { value: EIConfigValue[] }> =
    {};
  function traverse(node: any): void {
    if (!node) return;

    // Check if the node has xattr with name "ei-id"
    const ieIdAttr = node.xattr?.find(
      (attr: any) =>
        attr.name === "ei-id" ||
        attr.name === "ie-id" ||
        attr.name === "data-ie-id" ||
        attr.name === "data-ei-id"
    );

    if (ieIdAttr) {
      // Collect all text from this node's children
      const texts: string[] = [];

      function collectText(child: any): void {
        if (!child) return;
        if (child.text) {
          texts.push(child.text);
        } else if (child.children) {
          child.children.forEach(collectText);
        }
      }

      node.children.forEach(collectText);
      const finalText = texts
        .map((text) => text.split(","))
        .map((text) => text.map((t) => t.trim()))
        .flat()
        .map((text) => text.split("="))
        .map(([key, value]) => ({
          key: key.trim(),
          value:
            typeof value === "string" ? value.trim() : key,
        }))
        .flat();
      result[ieIdAttr.value] = { value: finalText };
    }

    // Recursively traverse children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(tree);
  return result;
}

onDomDataChange((dom) => {
  if (!dom) return;
  if ("symbols" in dom) {
    const tree = generateTree(dom.symbols);
    const extractedData = extractTextByIeId(tree);
    debug("📦 EI Config data", extractedData);
    _lastConfig = extractedData;
    _listeners.forEach((listener) =>
      listener(extractedData)
    );
  }
});

export const onIEConfigChange = (
  callback: (
    config: Record<string, { value: EIConfigValue[] }>
  ) => void
) => {
  _listeners.add(callback);
  if (_lastConfig) {
    callback(_lastConfig);
  }
  return () => {
    _listeners.delete(callback);
  };
};

export const getEIConfig = () => {
  return _lastConfig;
};
