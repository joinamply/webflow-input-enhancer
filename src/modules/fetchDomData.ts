export const fetchDomData = async () => {
  const response = await fetch(
    `https://${
      location.host
    }/api/sites/${location.host.replace(
      ".design.webflow.com",
      ""
    )}/dom?workflow=canvas&t=${Date.now()}`
  );
  const json = await response.json();
  return json;
};
