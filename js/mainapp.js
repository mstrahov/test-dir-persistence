import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";
import { AppStatusView } from "./appstatusview.js";
import { TabNavigationControl, BaseTabControl } from "./tabnavigationcontrol.js";

console.log("test main app");


window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();

const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid:"#statusdisplaycontrol"});
window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });

const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});
window.testtabnav = tabnavcontrol;

tabnavcontrol.addNewTab(BaseTabControl, {templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 1" , tabbody: "tab 1 body here" },);
tabnavcontrol.addNewTab(BaseTabControl, {templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 2" , tabbody: "tab 2 body here" },);

//~ window.duckdb.init();
//~ window.pyodideReadyPromise = window.pyodideloader.init();
