import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";
import { AppStatusView } from "./appstatusview.js";
import { TabNavigationControl, BaseTabControl } from "./tabnavigationcontrol.js";

console.log("test main app");

// =====  Interface layout

const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});
//window.testtabnav = tabnavcontrol; 

let tabNavStatusTab = tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:0, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#statusTabNavItemTemplate", tabbody: "App status" },);
tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:0, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 1" , tabbody: "tab 1 body here" },);
tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:-1, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 2" , tabbody: "tab 2 body here" },);

const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid: tabNavStatusTab.TabNavTitleElementSelector });
// =====  duckdb & pyodide

window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });



//~ window.duckdb.init();
//~ window.pyodideReadyPromise = window.pyodideloader.init();
