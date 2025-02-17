let _isExtendedAttrListEnabled = true;

export const setExtendedAttrListEnabled = async (
  value: boolean
) => {
  _isExtendedAttrListEnabled = value;
  await chrome.storage.sync.set({
    isExtendedAttrListEnabled: value,
  });
};

export const getExtendedAttrListEnabled = () => {
  return _isExtendedAttrListEnabled;
};

export const initExtendedAttrListStore = () => {
  chrome.storage.sync
    .get(["isExtendedAttrListEnabled"])
    .then((result) => {
      if (result.isExtendedAttrListEnabled) {
        setExtendedAttrListEnabled(
          result.isExtendedAttrListEnabled
        );
      } else {
        setExtendedAttrListEnabled(true);
      }
    });
};
