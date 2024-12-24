import { setDebug } from "./config/config";
import { initApp } from "./core/entry";
import { fetchDomData } from "./modules/fetchDomData";
import "./modules/getAllWebflowClassName";
import "./modules/getEIConfig";
//enable debug mode
setDebug(true);

//fetch the dom data
fetchDomData();
//initialize the app
initApp();
