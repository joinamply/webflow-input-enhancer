import { setDebug } from "./config/config";
import { initApp } from "./core/entry";
import { fetchDomData } from "./modules/fetchDomData";
import "./modules/getAllWebflowClassName";
import "./modules/getEIConfig";
import { initExtendedInputStore } from "./utils/extendedInputStore";
//enable debug mode
setDebug(true);

//fetch the dom data
fetchDomData();
//initialize the app
initApp();

//initialize the extended input store
initExtendedInputStore();
