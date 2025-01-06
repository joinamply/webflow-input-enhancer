const listenerList = new Set<(data: any) => void>();
let _lastResponse: any = null;
let _isRunning = false;
export const fetchDomData = async () => {
  if (_isRunning) {
    listenerList.forEach((cb) => cb(_lastResponse));
    return _lastResponse;
  }
  _isRunning = true;
  const response = await fetch(
    `https://${
      location.host
    }/api/sites/${location.host.replace(
      ".design.webflow.com",
      ""
    )}/dom?workflow=canvas&t=${Date.now()}`
  );
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
