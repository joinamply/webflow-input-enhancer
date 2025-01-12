/**
 * Sanitizes a string to make it suitable as a variable name.
 * @param input - The input string to sanitize.
 * @returns A sanitized, lowercase string suitable for use as a variable name.
 */
export function sanitizeForVariableName(
  input: string
): string {
  const length: number = input.length;
  let result: string = "";
  let start: number = 0;
  let end: number = length;

  // Find the first valid character from the start
  while (
    start < length &&
    !isNonCollapsablePermittedCharacter(input[start])
  ) {
    start += 1;
  }

  // Find the first valid character from the end
  while (
    end > 0 &&
    !isNonCollapsablePermittedCharacter(input[end - 1])
  ) {
    end -= 1;
  }

  // Process the characters between the valid start and end
  for (let i = start; i < end; i += 1) {
    let char: string = input[i];

    if (char === "/") {
      // Handle forward slashes by replacing them with `--`
      if (result.endsWith("-")) {
        result = result.slice(0, -1); // Remove trailing `-`
      }

      while (i < end) {
        char = input[++i];
        if (isNonCollapsablePermittedCharacter(char)) {
          result += "--" + char;
          break;
        }
      }
    } else if (isNonCollapsablePermittedCharacter(char)) {
      // Append valid characters
      result += char;
    } else if (!result.endsWith("-")) {
      // Replace invalid characters with a single `-`
      result += "-";
    }
  }

  return result.toLowerCase();
}

/**
 * Checks if a character is a valid, non-collapsible, permitted character for a variable name.
 * @param char - A single character to validate.
 * @returns True if the character is valid; false otherwise.
 */
function isNonCollapsablePermittedCharacter(
  char: string
): boolean {
  const charCode: number = char.charCodeAt(0);

  // Allow alphanumeric characters, underscores, and Unicode characters >= 128
  const isAllowed =
    charCode >= 128 ||
    (charCode >= 97 && charCode <= 122) || // a-z
    (charCode >= 65 && charCode <= 90) || // A-Z
    (charCode >= 48 && charCode <= 57) || // 0-9
    char === "_";

  // Exclude characters that match the `b` regex pattern (assumed globally defined)
  const regex: RegExp = /some_pattern/; // Replace `some_pattern` with the actual regex for `b`.
  return isAllowed && !regex.test(char);
}
