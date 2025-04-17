import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";
import { AppStatusView } from "./appstatusview.js";
import { TabNavigationControl, BaseTabControl, DropDownTabControl } from "./tabnavigationcontrol.js";
import { MenuEventsControl } from "./menueventscontrol.js";
import { AppPageControl }  from "./apppagecontrol.js";
import { GridItem } from  "./griditem.js";
import { GridItemWithMenu } from  "./griditemwithmenu.js";
import { GridItemPyEditor } from  "./griditempyeditor.js";
import  { CodeRunner } from "./coderunner.js";
import { GridItemTextOutput, StatusGridItemTextOutput } from "./griditemtextoutput.js";



console.log("test main app");

// =====  Interface layout

const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});


// ======  DuckDB & Pyodide
window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();
window.coderunner = new CodeRunner({duckdbloader: window.duckdb, pyodideloader: window.pyodideloader});

//  --------- Status Tab (right-most)
const tabNavStatusTab = new AppPageControl( { 
			tabnavcontrol: tabnavcontrol,  
			baseTabControlType:BaseTabControl, 
			insertBeforePosition:0, 
			templateid: "#emptyTabContentTemplate", 
			navitemtemplateid: "#statusTabNavItemTemplate", 
			coderunner: window.coderunner,
			//tabtitle: "New App Page 1" , 
			//DropDownMenuTemplateID: "#menuAppTab01",
		});
tabNavStatusTab.appuuid="globals";

const pyeditor = tabNavStatusTab.addGridItem(GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
const statusTabOutput = tabNavStatusTab.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output:", griditemoptions: {w:6,h:5,} });

//  ---------- Menu tab (left-most)
let tabNavMainMenuTab = tabnavcontrol.addNewTab(DropDownTabControl, {insertBeforePosition:0,  navitemtemplateid: "#mainmenuTabNavItemTemplate", });
let mainMenuControl = new MenuEventsControl({dropDownMenuElementId:tabNavMainMenuTab.DropDownMenuElementSelector, parentUUID: tabNavMainMenuTab.uuid, multiLevelMenu:false});
mainMenuControl.eventbus.subscribe('menuitemclick',(obj,eventdata)=>{ 
		console.log("mainmenuitemclick",obj,eventdata); 
	});

//tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:-1, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 1" , tabbody: "tab 1 body here" });

const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid: tabNavStatusTab.contenttab.TabNavTitleElementSelector });

// -------------------------------------------------------------------------------------------------
// newAppMenu templates :  #menuAppTab01
// -------------------------------------------------------------------------------------------------
//~ //  --------    New app page test
//~ const newAppPage = new AppPageControl( { 
			//~ tabnavcontrol: tabnavcontrol,  
			//~ baseTabControlType:BaseTabControl, 
			//~ insertBeforePosition:-1, 
			//~ templateid: "#emptyTabContentTemplate", 
			//~ navitemtemplateid: "#emptyTabNavItemTemplate", 
			//~ tabtitle: "New App Page 1" , 
			//~ DropDownMenuTemplateID: "#menuAppTab01",
		//~ });

//~ const pyeditor = newAppPage.addGridItem(GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Py Code Editor", griditemoptions: {w:6,h:5,} });
//~ const textoutput = newAppPage.addGridItem(GridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Py Output", griditemoptions: {w:6,h:5,} });
//~ //  --------   / New app page test
// -------------------------------------------------------------------------------------------------

// =====  duckdb & pyodide



window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{  statusTabOutput.statusUpdate(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{  statusTabOutput.statusUpdate(eventdata); });


window.coderunner.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.coderunner.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });

// =====  duckdb & pyodide init
window.dbconnReadyPromise = window.duckdb.init();
window.pyodideReadyPromise = window.pyodideloader.init();


// ===== pyodide 
