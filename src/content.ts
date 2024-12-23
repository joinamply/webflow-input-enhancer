import { setDebug } from "./config/config";
import { initApp } from "./core/entry";

import { initClassNameFetch } from "./modules/getAllWebflowClassName";

//enable debug mode
setDebug(true);

//initialize the class name fetch
initClassNameFetch();
//initialize the app
initApp();
