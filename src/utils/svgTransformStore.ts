const STORAGE_KEY = "svgThemeColorsEnabled";

//theme colors (fill -> currentColor) is opt-out, so default to true
let _themeColorsEnabled = true;

export const setSvgThemeColorsEnabled = async (
  value: boolean
) => {
  _themeColorsEnabled = value;
  await chrome.storage.sync.set({ [STORAGE_KEY]: value });
};

export const getSvgThemeColorsEnabled = () => {
  return _themeColorsEnabled;
};

//async read for contexts without the cached value (e.g. the popup)
export const readSvgThemeColorsEnabled = async () => {
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  return result[STORAGE_KEY] !== false;
};

//read the persisted value and keep it in sync with the popup so a
//toggle takes effect without reloading the Designer tab
export const initSvgTransformStore = () => {
  readSvgThemeColorsEnabled().then((enabled) => {
    _themeColorsEnabled = enabled;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (!(STORAGE_KEY in changes)) return;
    _themeColorsEnabled =
      changes[STORAGE_KEY].newValue !== false;
  });
};
