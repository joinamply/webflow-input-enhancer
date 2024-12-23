import { canDebug, setDebug } from "../config/config";

export const debug = (...message: any[]) => {
  if (canDebug()) {
    console.log(`[🚀 Webflow Input Enhancer]`, ...message);
  }
};

(window as any).setInputEnhancerDebug = (
  value: boolean
) => {
  setDebug(value);
};
