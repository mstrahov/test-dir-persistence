import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";
import { AppStatusView } from "./appstatusview.js";
import { TabNavigationControl, BaseTabControl, DropDownTabControl } from "./tabnavigationcontrol.js";
import { MenuEventsControl } from "./menueventscontrol.js";
import { AppPageControl }  from "./apppagecontrol.js";
import { AppPageScriptControl }  from "./apppagescriptcontrol.js";
import { GridItem } from  "./griditem.js";
import { GridItemWithMenu } from  "./griditemwithmenu.js";
import { GridItemPyEditor } from  "./griditempyeditor.js";
import { GridItemSQLEditor } from  "./griditemsqleditor.js";
import  { CodeRunner } from "./coderunner.js";
import { GridItemTextOutput, StatusGridItemTextOutput } from "./griditemtextoutput.js";
import { FileIOHandler } from "./fileiohandler.js"
import { gridItemFileDialog } from "./griditemfiledialog.js"
import { TabulatorPicker } from "./tabupicker.js";
import { modalDialogInput } from "./modaldialoginput.js";

//console.log("test main app");
// =====  Interface layout
const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});
// ======  DuckDB & Pyodide
window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();
window.fileiohandler = new FileIOHandler({duckdbloader: window.duckdb, pyodideloader: window.pyodideloader});
window.coderunner = new CodeRunner({duckdbloader: window.duckdb, pyodideloader: window.pyodideloader, fileIOHandler: window.fileiohandler });

// ============= user dialogs ====================================
let tablePicker = new TabulatorPicker({templateid:"#tabulatorpickertemplate"});
let modalInput = new modalDialogInput({templateid:"#editfieldvaluetemplate"});
//  ======================== Status Tab (right-most tab under spinner)
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

const pyeditor = tabNavStatusTab.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
const statusTabOutput = tabNavStatusTab.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
const sqleditor = tabNavStatusTab.addGridItem( GridItemSQLEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "SQL", griditemoptions: {w:6,h:5,} });
const filedialog = tabNavStatusTab.addGridItem( gridItemFileDialog, {templateid:"#gridItemFileDialog", headertext: "Local files", griditemoptions: {w:6,h:5,}, fileIOHandler: window.fileiohandler });

//  ---------- Menu tab (left-most)
let tabNavMainMenuTab = tabnavcontrol.addNewTab(DropDownTabControl, {insertBeforePosition:0,  navitemtemplateid: "#mainmenuTabNavItemTemplate", });
let mainMenuControl = new MenuEventsControl({dropDownMenuElementId:tabNavMainMenuTab.DropDownMenuElementSelector, parentUUID: tabNavMainMenuTab.uuid, multiLevelMenu:false});


//  === spinner visual init
const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid: tabNavStatusTab.contenttab.TabNavTitleElementSelector });

// =====  duckdb & pyodide events

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); }, appstatusview.uuid);
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); }, appstatusview.uuid);

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{  statusTabOutput.statusUpdate(eventdata); }, statusTabOutput.uuid);
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{  statusTabOutput.statusUpdate(eventdata); }, statusTabOutput.uuid);

// ======  coderunner events
window.coderunner.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); }, appstatusview.uuid);
window.coderunner.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); }, appstatusview.uuid);

//  fileio dbfileStatusChange events
window.fileiohandler.eventbus.subscribe('iostatechange',(obj,eventdata)=>{  appstatusview.dbfileStatusChange(eventdata); }, appstatusview.uuid);
window.fileiohandler.eventbus.subscribe('iostatechange',(obj,eventdata)=>{  statusTabOutput.statusUpdate(eventdata); }, statusTabOutput.uuid);

window.fileiohandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  filedialog.refreshData(eventdata); }, filedialog.uuid);
// ioError  ioUnsupportedError  ioMessage
window.fileiohandler.eventbus.subscribe('ioError',(obj,eventdata)=>{  statusTabOutput.ioMessageUpdate(eventdata); }, statusTabOutput.uuid);
window.fileiohandler.eventbus.subscribe('ioUnsupportedError',(obj,eventdata)=>{  statusTabOutput.ioMessageUpdate(eventdata); }, statusTabOutput.uuid);
window.fileiohandler.eventbus.subscribe('ioMessage',(obj,eventdata)=>{  statusTabOutput.ioMessageUpdate(eventdata); }, statusTabOutput.uuid);

// =====  duckdb & pyodide & fileiohandler init
window.dbconnReadyPromise = window.duckdb.init();
window.pyodideReadyPromise = window.pyodideloader.init();
window.fileiohandler.init();

// =====  py editor/ output events in tabnavcontrol
//tabNavStatusTab
pyeditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ tabNavStatusTab.runCmdFromGridItem('py',obj,eventdata);  }, tabNavStatusTab.uuid);
//console.log("PYEDITOR:", pyeditor.widgetName);
tabNavStatusTab.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{   statusTabOutput.runExecutionUpdate(eventdata);  }, statusTabOutput.uuid);
tabNavStatusTab.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{  statusTabOutput.runExecutionUpdate(eventdata);  }, statusTabOutput.uuid);
tabNavStatusTab.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{   statusTabOutput.runExecutionFailure(eventdata);  }, statusTabOutput.uuid);

sqleditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ tabNavStatusTab.runCmdFromGridItem('sql',obj,eventdata);  }, tabNavStatusTab.uuid);




// ==================================================================
let activetabs = [];
const OpenNewScriptTab = ()=>{   
	let newtab = new AppPageScriptControl( { 
			tabnavcontrol: tabnavcontrol,  
			baseTabControlType:BaseTabControl, 
			insertBeforePosition:-1, 
			templateid: "#emptyTabContentTemplate", 
			navitemtemplateid: "#emptyTabNavItemTemplate", 
			coderunner: window.coderunner,
			tabtitle: "New Script" , 
			DropDownMenuTemplateID: "#menuAppTab01",
			fileIOHandler: window.fileiohandler,
			tablePickerDialog: tablePicker,
			modalInputDialog: modalInput,
		});
	activetabs.push(newtab);
};


// ====== tabNavMainMenuTab - main left menu actions in tabs events

mainMenuControl.eventbus.subscribe('menuitemclick',(obj,eventdata)=>{ 
		console.log("mainmenuitemclick",obj,eventdata); 
		if (eventdata?.menuItemId === "openmntdir") {
			window.fileiohandler.mountDirectory();
		} else if (eventdata?.menuItemId === "newscriptmenuaction") { 	
			//console.log("NEW SCRIPT");
			OpenNewScriptTab();
		//~ } else if (eventdata?.menuItemId === "refreshgriditem" || eventdata?.menuItemId ===  "refreshaction") {      
		}
	});

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

//  new tab example
//tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:-1, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 1" , tabbody: "tab 1 body here" });
