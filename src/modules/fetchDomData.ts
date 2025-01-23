const listenerList = new Set<(data: any) => void>();
let _lastResponse: any = null;
let _isRunning = false;
const getURL = () => {
  if (location.host.includes("preview.webflow.com")) {
    const projectName = location.pathname
      .split("/preview/")
      .reverse()[0];
    const previewId = new URLSearchParams(
      location.search
    ).get("preview");
    if (projectName && previewId) {
      return `https://preview.webflow.com/preview/api/dom/get/${projectName}?utm_medium=preview_link&utm_source=designer&utm_content=${projectName}&preview=${previewId}&workflow=canvas&t=${Date.now()}`;
    }
  }
  return `https://${
    location.host
  }/api/sites/${location.host.replace(
    ".design.webflow.com",
    ""
  )}/dom?workflow=canvas&t=${Date.now()}`;
};
export const fetchDomData = async () => {
  if (_isRunning) {
    listenerList.forEach((cb) => cb(_lastResponse));
    return _lastResponse;
  }
  _isRunning = true;
  const response = await fetch(getURL());
  const json = await response.json();
  listenerList.forEach((cb) => cb(json));
  _lastResponse = json;
  _isRunning = false;
  return json;
};
export const onDomDataChange = (
  cb: (data: any) => void
) => {
  const unsubscribe = () => {
    listenerList.delete(cb);
  };
  if (_lastResponse) {
    cb(_lastResponse);
  }
  listenerList.add(cb);
  return unsubscribe;
};
