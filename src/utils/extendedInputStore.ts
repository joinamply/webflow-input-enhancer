let _isExtendedInputEnabled = true;

export const setExtendedInputEnabled = async (
  value: boolean
) => {
  _isExtendedInputEnabled = value;
  await chrome.storage.sync.set({
    isExtendedInputEnabled: value,
  });
};

export const getExtendedInputEnabled = () => {
  return _isExtendedInputEnabled;
};

export const initExtendedInputStore = () => {
  chrome.storage.sync
    .get(["isExtendedInputEnabled"])
    .then((result) => {
      if (result.isExtendedInputEnabled) {
        setExtendedInputEnabled(
          result.isExtendedInputEnabled
        );
      } else {
        setExtendedInputEnabled(true);
      }
    });
};
