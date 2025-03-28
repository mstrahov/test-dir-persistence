import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";
import { AppStatusView } from "./appstatusview.js";

console.log("test main app");


window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();

const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid:"#statusdisplaycontrol"});
window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });

window.duckdb.init();
window.pyodideReadyPromise = window.pyodideloader.init();
