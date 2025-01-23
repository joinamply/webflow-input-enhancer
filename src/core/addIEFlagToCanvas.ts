export const addIEFlagToCanvas = () => {
  const iframe = document.querySelector(
    `#site-iframe-next`
  ) as HTMLIFrameElement;
  if (!iframe) return;
  const iframeDocument =
    iframe.contentDocument ||
    iframe.contentWindow?.document;
  if (!iframeDocument) return;

  const html = iframeDocument.querySelector("html");
  const body = iframeDocument.querySelector("body");
  if (html) {
    html.setAttribute("ie-is-active", "true");
  }
  if (body) {
    body.setAttribute("ie-is-active", "true");
  }
};
