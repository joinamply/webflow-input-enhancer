interface ParsedResult {
  name: string;
  type: string | null;
  id: string | null;
  inlineConfig: string[] | null;
}
export function parseFieldName(input: string) {
  const result: ParsedResult = {
    name: input.trim(), // Default the whole input as name
    type: null,
    id: null,
    inlineConfig: null,
  };

  // Match the [Type=ID] or [Type] pattern
  const matchType = input.match(
    /\s*\[([\w-]+)(?:=([\w-]+))?\]\s*/
  );
  if (matchType) {
    result.type = matchType[1]; // Extract the type (e.g., Class, Dropdown)
    result.id = matchType[2] || null; // Extract the id if present, otherwise null
    result.name = input
      .substring(0, matchType.index)
      .trim(); // Extract text before [
  }

  // Match the inline configuration {a,b,c}
  const matchConfig = input.match(/\s*\{([^}]+)\}\s*/);
  if (matchConfig) {
    result.inlineConfig = matchConfig[1]
      .split(",")
      .map((item) => item.trim());
  }

  return result;
}
