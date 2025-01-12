import { setDebug } from "./config/config";
import { initApp } from "./core/entry";
import { fetchDomData } from "./modules/fetchDomData";
import "./modules/getAllWebflowClassName";
import "./modules/getEIConfig";
import "./modules/gellAllVariables";
import { initExtendedInputStore } from "./utils/extendedInputStore";
//enable debug mode
setDebug(import.meta.env.MODE === "development");
//fetch the dom data
fetchDomData();
//initialize the app
initApp();

//initialize the extended input store
initExtendedInputStore();
