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
import { OwnFormatHandler } from "./ownformathandler.js";
import { gridItemOwnFormat } from "./griditemownformat.js";

//console.log("test main app");
// ==============  page close warning

window.addEventListener("beforeunload", function (e) {
	e.preventDefault();
	var confirmationMessage = 'Leave site? Changes you made may not be saved.';
	(e || window.event).returnValue = confirmationMessage;
	return confirmationMessage; 
});


// =====  Interface layout
const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});
// ======  DuckDB & Pyodide
window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();
window.fileiohandler = new FileIOHandler({duckdbloader: window.duckdb, pyodideloader: window.pyodideloader});
window.coderunner = new CodeRunner({duckdbloader: window.duckdb, pyodideloader: window.pyodideloader, fileIOHandler: window.fileiohandler });

// ======== Format saver
window.localFormatSaver = new OwnFormatHandler({
		pyodidePromise: window.pyodideloader.pyodideReadyPromise(), 
		FileIOHandler: window.fileiohandler,
		coderunner: window.coderunner,  
		namespaceuuid: "globals",
		dbFileName: "/app/opfs/default.adhocdb"
});
window.localFormatSaver.init();

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

window.testgrid = tabNavStatusTab;

const pyeditor = tabNavStatusTab.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Python", griditemoptions: {w:6,h:4,} });
const statusTabOutput = tabNavStatusTab.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:8,} });
const sqleditor = tabNavStatusTab.addGridItem( GridItemSQLEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "SQL", griditemoptions: {w:6,h:4,} });
const ownformatdialog = tabNavStatusTab.addGridItem( gridItemOwnFormat, {templateid:"#gridItemOwnFormatDialog", headertext: "Project file", griditemoptions: {w:6,h:6,}, OwnFormatHandler: window.localFormatSaver });
const filedialog = tabNavStatusTab.addGridItem( gridItemFileDialog, {templateid:"#gridItemFileDialog", headertext: "Local files", griditemoptions: {w:6,h:6,}, fileIOHandler: window.fileiohandler });

//  ---------- Menu tab (left-most)
let tabNavMainMenuTab = tabnavcontrol.addNewTab(DropDownTabControl, {insertBeforePosition:0,  navitemtemplateid: "#mainmenuTabNavItemTemplate", });
let mainMenuControl = new MenuEventsControl({dropDownMenuElementId:tabNavMainMenuTab.DropDownMenuElementSelector, parentUUID: tabNavMainMenuTab.uuid, multiLevelMenu:false});


//  === spinner visual init
const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid: tabNavStatusTab.contenttab.TabNavTitleElementSelector });

// =====  duckdb & pyodide events

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); }, appstatusview.uuid);
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /*console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); }, appstatusview.uuid);

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


// ================================================================== newscriptmenuaction
let activetabs = [];
const OpenNewScriptTab = (scriptobj, initiallayout=1) => {   
	let newtab = new AppPageScriptControl( { 
			scriptobj: scriptobj,
			initiallayout: initiallayout,
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
	
	newtab.eventbus.subscribe('scriptnamechange', (obj,eventdata)=> {  
			window.localFormatSaver.updateScriptArrayData(eventdata);
			updateOwnFormatDialogData();  
		}
	, tabNavStatusTab.uuid);
	// -------------- 
	newtab.eventbus.subscribe('closebuttonaction', (obj,eventdata)=> {  
			console.log('Script tab close command!');
			obj.destroy();	
			tabNavStatusTab.contenttab.show();
		} 
	, tabNavStatusTab.uuid);
	// -------------- 
	newtab.eventbus.subscribe('savelayout', (obj,eventdata)=> {  
			console.log('Script tab savelayout command!');
		} 
	, tabNavStatusTab.uuid);
		
	
};


// ================================================================== own format handler

const updateOwnFormatDialogData = () => {
	if (ownformatdialog) {
		let datatree = window.localFormatSaver.generateTabulatorTree();
		ownformatdialog.refreshData({ source: 'tabNavStatusTab', datatree: datatree });
	}
}

// ================================================================== own format handler
ownformatdialog.eventbus.subscribe('datacelledited',
	(obj,eventdata)=>
		{ 
			//console.log("datacelledited",eventdata);
			window.localFormatSaver.updateScriptArrayData(eventdata);
			if (eventdata.fieldname==="name") {	
				const ind = activetabs.findIndex((val)=>val.uuid===eventdata.rowdata.objuuid);
				if (ind>-1) {
					activetabs[ind].setScriptName(eventdata.newvalue.trim());
				}
			}
		}
, tabNavStatusTab.uuid);


ownformatdialog.eventbus.subscribe('datarefreshrequested', (obj,eventdata)=>  { updateOwnFormatDialogData(); } , tabNavStatusTab.uuid);

// ================================================================== save project menu action

const SaveProjectFile = async () => {   
	// name, objuuid, objtype, stringval
	await window.localFormatSaver.writeObjectFromString("format_version", "format_version", "format_version", window.localFormatSaver.FORMAT_VERSION );
	//await window.localFormatSaver.writeObjectFromString("test1", "test2", "test3", "test4");
	/* saving objects:
		activetabs = []
	
	*/
	for (let i=0;i<activetabs.length;i++) {
		let tabobj = activetabs[i].toOwnFormat();
		tabobj.isopen = true;
		tabobj.autorun = true;
		tabobj.runorder = (i+1)*10;
		
		
		//console.log(`TAB: ${i}`, tabobj , JSON.stringify(tabobj));
		await window.localFormatSaver.writeObjectFromString(tabobj.name, tabobj.objuuid, tabobj.objtype, JSON.stringify(tabobj));
		//console.log("GRID LAYOUT ",activetabs[i].layoutToJSON());
	}
};

// ================================================================== open project menu action

const OpenProjectFile = async () => {   
	// name, objuuid, objtype, stringval
	//await window.localFormatSaver.writeObjectFromString("format_version", "format_version", "format_version", window.localFormatSaver.FORMAT_VERSION );
	//await window.localFormatSaver.writeObjectFromString("test1", "test2", "test3", "test4");
	/* saving objects:
		activetabs = []
	
	*/
	let file_format_ver = await window.localFormatSaver.readObjectToString("format_version", "format_version");
	console.log(`Open project file ${window.localFormatSaver.dbfilename} format ver ${file_format_ver}`);
	let file_stats = await window.localFormatSaver.getObjTypeStats();
	console.log('File stats: ', file_stats);
	
	window.localFormatSaver.scriptsarr = await window.localFormatSaver.getScriptsArrayFromOwnFormatFile();
	console.log('Scripts: ', window.localFormatSaver.scriptsarr);
	window.localFormatSaver.scriptsarr.sort((a, b)=>a.runorder-b.runorder);
	
	for (let i=0;i<window.localFormatSaver.scriptsarr.length;i++) {
		const ind = activetabs.findIndex((v)=>v.uuid===window.localFormatSaver.scriptsarr[i].objuuid);
		if (ind===-1) { 
			if (window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps?.length>0) {
				let res = await window.coderunner.runScriptStepsAndUpdateInPlace(
												window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps, 
												window.localFormatSaver.scriptsarr[i].objuuid
										);
				if (res?.runStatus) {
					window.localFormatSaver.scriptsarr[i].scriptObject.lastRunStatus = res.runStatus;
					window.localFormatSaver.scriptsarr[i].scriptObject.lastRunResult = res.runResult;
				}						
			}
			OpenNewScriptTab(window.localFormatSaver.scriptsarr[i]); 
		}
	}
	
	updateOwnFormatDialogData();
	if (activetabs.length>0) {
		activetabs[0].contenttab.show();
	}
	
	
	
	
};


// ====== tabNavMainMenuTab - main left menu actions in tabs events    

mainMenuControl.eventbus.subscribe('menuitemclick',(obj,eventdata)=>{ 
		console.log("mainmenuitemclick",obj,eventdata); 
		if (eventdata?.menuItemId === "openmntdir") {
			window.fileiohandler.mountDirectory();
		} else if (eventdata?.menuItemId === "newscriptmenuaction") { 	
			OpenNewScriptTab();
		} else if (eventdata?.menuItemId === "newscriptsqlmenuaction") { 	
			OpenNewScriptTab(undefined,2);
		} else if (eventdata?.menuItemId === "saveprojectfilemenuaction") { 
			//console.log("saveprojectfilemenuaction");
			SaveProjectFile(); 
		} else if (eventdata?.menuItemId === "openprojectfile") { 
			//console.log("saveprojectfilemenuaction");
			OpenProjectFile(); 
		}
	});

//
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



