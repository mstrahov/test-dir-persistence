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
import { FileUploadButton, FileDownLoadDialog } from "./filedialogs.js";

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
		dbFileName: "/app/opfs/default.adhocdb",
		duckdbloader: window.duckdb,
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
let mainMenuControl = new MenuEventsControl({dropDownMenuElementId:tabNavMainMenuTab.DropDownMenuElementSelector, parentUUID: tabNavMainMenuTab.uuid, multiLevelMenu:true});


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

// ======= window.localFormatSaver = new OwnFormatHandler output events 
// ownformatoperation_start  ownformatoperation_error  ownformatoperation_message  ownformatoperation_success
window.localFormatSaver.eventbus.subscribe('statechange',(obj,eventdata)=>{   statusTabOutput.ioMessageUpdate(eventdata);  }, statusTabOutput.uuid);

// =====  file dialog events

filedialog.eventbus.subscribe('exportdatabasetodir', (obj,eventdata)=>{  
	// { fullpath: row.getData().fullpath, type: row.getData().type}   //rowdata.type === 'directory'
	
	(async (obj,eventdata)=>{
		let dirPath = eventdata?.fullpath;
		if (eventdata?.type!=='directory') {
			const spl = dirPath.split('/');
			if (spl.length>0) {
				dirPath = dirPath.substring(0,dirPath.length-spl[spl.length-1].length);
			} 
			if (dirPath.endsWith('/')) { dirPath = dirPath.substring(0,dirPath.length-1); }
		}
		await window.localFormatSaver.exportDuckDbToDirPath(dirPath);
		
	})(obj,eventdata);
	
	
});

filedialog.eventbus.subscribe('deletefilecmd', (obj,eventdata)=>{  
	// { fullpath: row.getData().fullpath, type: row.getData().type}   //rowdata.type === 'directory'
	
	(async (obj,eventdata)=>{
		let dirPath = eventdata?.fullpath;
		if (dirPath && eventdata?.type!=='directory') {
			let res = await window.fileiohandler.deleteFileFromFSandFileHandle(dirPath);
			if (res) {
				console.log(`"Deleted ${dirPath}`);
			}
		}

	})(obj,eventdata);
	
	
});

// project file upload button
const PROJ_FILE_TEMP_PATH = "/app/temp";
const PROJ_FILE_TEMP_NAME = "importdbtemp.adhocdb";

let projfilefileuploaddialog = new FileUploadButton({  
		containertemplateid: "#hiddenuploadbuttontemplate", 
		containerid:"#projfileuploaddialogplaceholder",  
		fileSystemHandler: window.fileiohandler,
		uploadToFilePath: PROJ_FILE_TEMP_PATH,
		uploadToFileName: PROJ_FILE_TEMP_NAME,
	});
 

// ================================================================== newscriptmenuaction
let activetabs = [];
const OpenNewScriptTab = (scriptobj, initiallayout=1, insertbeforeind=-1) => {   
	let newtab = new AppPageScriptControl( { 
			scriptobj: scriptobj,
			initiallayout: initiallayout,
			tabnavcontrol: tabnavcontrol,  
			baseTabControlType:BaseTabControl, 
			insertBeforePosition: insertbeforeind, 
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
			//console.log('Script tab close command!');
			(async ()=>{
				const ind = activetabs.findIndex((val)=>val.uuid===obj.uuid);
				await window.localFormatSaver.saveScriptData(obj, false);
				obj.destroy();	
				updateOwnFormatDialogData();
				tabNavStatusTab.contenttab.show();
				if (ind>-1) {
					activetabs.splice(ind,1);
				}
			})(obj);
		} 
	, tabNavStatusTab.uuid);
	// -------------- 
	newtab.eventbus.subscribe('savelayout', (obj,eventdata)=> {  
			console.log('Script tab savelayout command!');
			(async ()=>{
				await window.localFormatSaver.saveScriptData(obj);
				updateOwnFormatDialogData();
			})(obj);
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
// openscriptcommand

ownformatdialog.eventbus.subscribe('openscriptcommand',
	(obj,eventdata)=>
		{ 
			//console.log("datacelledited",eventdata);
			// { objtype: currow.objtype, objuuid: currow.objuuid, }
			const ind = activetabs.findIndex((v)=>v.uuid===eventdata.objuuid);
			if (ind>-1) {
				// already open
				activetabs[ind].contenttab.show();
			} else {
				window.localFormatSaver.scriptsarr.sort((a, b)=>a.runorder-b.runorder);
				const ind1 = window.localFormatSaver.scriptsarr.findIndex((v)=>v.objuuid===eventdata.objuuid);
				if (ind1>-1) {
					
					let insertbeforeind=0;
					for (let i=0;i<ind1;i++) {
						if (activetabs.findIndex((v)=>v.uuid===window.localFormatSaver.scriptsarr[i].objuuid)>-1) {
							insertbeforeind+=2;
						};
					}
					
					OpenNewScriptTab(window.localFormatSaver.scriptsarr[ind1], undefined, insertbeforeind+1);
				} 
			}
			
		}
, tabNavStatusTab.uuid);

ownformatdialog.eventbus.subscribe('runscriptcommand',
	(obj,eventdata)=>
		{ 
			//console.log("datacelledited",eventdata);
			// { objtype: currow.objtype, objuuid: currow.objuuid, }   eventdata.objuuid
			(async (obj,eventdata)=>{
				const ind = activetabs.findIndex((v)=>v.uuid===eventdata.objuuid);
				if (ind>-1) {
					// already open, save script data before running
					await window.localFormatSaver.saveScriptData(activetabs[ind]);
				} 
				
				const ind1 = window.localFormatSaver.scriptsarr.findIndex((v)=>v.objuuid===eventdata.objuuid);
				if (ind1>-1) {
					if (window.localFormatSaver.scriptsarr[ind1].scriptObject?.transformSteps?.length>0) {
						let res = await window.coderunner.runScriptStepsAndUpdateInPlace(
														window.localFormatSaver.scriptsarr[ind1].scriptObject?.transformSteps, 
														window.localFormatSaver.scriptsarr[ind1].objuuid
												);
						if (res?.runStatus) {
							window.localFormatSaver.scriptsarr[ind1].scriptObject.lastRunStatus = res.runStatus;
							window.localFormatSaver.scriptsarr[ind1].scriptObject.lastRunResult = res.runResult;
						}	
						
						updateOwnFormatDialogData();					
					}
				}
			})(obj,eventdata);
		}
, tabNavStatusTab.uuid);

ownformatdialog.eventbus.subscribe('deletescriptcommand',
	(obj,eventdata)=>
		{ 
			//console.log("datacelledited",eventdata);
			// { objtype: currow.objtype, objuuid: currow.objuuid, }   eventdata.objuuid
			(async (obj,eventdata)=>{
				const ind = activetabs.findIndex((v)=>v.uuid===eventdata.objuuid);
				if (ind>-1) {
					// already open, save script data before running
					console.log("Only closed scripts can be permanently deleted.");
				} else {
					await window.localFormatSaver.deleteScript(eventdata.objuuid);
					updateOwnFormatDialogData();
				}		
			})(obj,eventdata);
		}
, tabNavStatusTab.uuid);


// ================================================================== save project menu action

const SaveProjectFile = async () => {   
	// name, objuuid, objtype, stringval
	await window.localFormatSaver.writeObjectFromString("format_version", "format_version", "format_version", window.localFormatSaver.FORMAT_VERSION );
	//await window.localFormatSaver.writeObjectFromString("test1", "test2", "test3", "test4");
	/* saving objects:
		activetabs = []
	
	*/
	// save scripts open in the interface
	for (let i=0;i<activetabs.length;i++) {
		await window.localFormatSaver.saveScriptData(activetabs[i]);
		
		//~ let tabobj = activetabs[i].toOwnFormat();
		//~ tabobj.isopen = true;
		//~ tabobj.autorun = true;
		//~ tabobj.runorder = (i+1)*10;
		//~ //console.log(`TAB: ${i}`, tabobj , JSON.stringify(tabobj));
		//~ await window.localFormatSaver.writeObjectFromString(tabobj.name, tabobj.objuuid, tabobj.objtype, JSON.stringify(tabobj));
		//~ //console.log("GRID LAYOUT ",activetabs[i].layoutToJSON());
	}
	// save closed scripts
	for (let i=0;i<window.localFormatSaver.scriptsarr.length;i++) {
		const ind = activetabs.findIndex((v)=>v.uuid===window.localFormatSaver.scriptsarr[i].objuuid);
		if (ind===-1) {
			await window.localFormatSaver.saveScriptByUuid(window.localFormatSaver.scriptsarr[i].objuuid);
		}
	}
	console.log("Local Project File Saved.");
		
};



// =========================================  open all scripts from window.localFormatSaver.scriptsarr

const OpenAndReRunAllLocalScripts = async () => {   
	// name, objuuid, objtype, stringval
	//await window.localFormatSaver.writeObjectFromString("format_version", "format_version", "format_version", window.localFormatSaver.FORMAT_VERSION );
	//await window.localFormatSaver.writeObjectFromString("test1", "test2", "test3", "test4");
	/* saving objects:
		activetabs = []
	
	*/
	//~ let file_format_ver = await window.localFormatSaver.readObjectToString("format_version", "format_version");
	//~ console.log(`Open project file ${window.localFormatSaver.dbfilename} format ver ${file_format_ver}`);
	//~ let file_stats = await window.localFormatSaver.getObjTypeStats();
	//~ console.log('File stats: ', file_stats);
	
	//~ window.localFormatSaver.scriptsarr = await window.localFormatSaver.getScriptsArrayFromOwnFormatFile();
	//~ console.log('Scripts: ', window.localFormatSaver.scriptsarr);
	//~ window.localFormatSaver.scriptsarr.sort((a, b)=>a.runorder-b.runorder);
	
	for (let i=0;i<window.localFormatSaver.scriptsarr.length;i++) {
		const ind = activetabs.findIndex((v)=>v.uuid===window.localFormatSaver.scriptsarr[i].objuuid);
		if (ind===-1) { 
			if (window.localFormatSaver.scriptsarr[i].autorun && window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps?.length>0) {
				let res = await window.coderunner.runScriptStepsAndUpdateInPlace(
												window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps, 
												window.localFormatSaver.scriptsarr[i].objuuid
										);
				
				window.localFormatSaver.scriptsarr[i].scriptObject.lastRunStatus = res?.runStatus;
				if (res?.runStatus) {
					window.localFormatSaver.scriptsarr[i].scriptObject.lastRunResult = res.runResult;
				} 					
			} else {
				window.localFormatSaver.scriptsarr[i].scriptObject.lastRunStatus = null;
			}
			if (window.localFormatSaver.scriptsarr[i].isopen) {
				OpenNewScriptTab(window.localFormatSaver.scriptsarr[i]);
			} 
		}
	}
	
	//~ updateOwnFormatDialogData();
	if (activetabs.length>0) {
		activetabs[0].contenttab.show();
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
	
	//~ for (let i=0;i<window.localFormatSaver.scriptsarr.length;i++) {
		//~ const ind = activetabs.findIndex((v)=>v.uuid===window.localFormatSaver.scriptsarr[i].objuuid);
		//~ if (ind===-1) { 
			//~ if (window.localFormatSaver.scriptsarr[i].autorun && window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps?.length>0) {
				//~ let res = await window.coderunner.runScriptStepsAndUpdateInPlace(
												//~ window.localFormatSaver.scriptsarr[i].scriptObject?.transformSteps, 
												//~ window.localFormatSaver.scriptsarr[i].objuuid
										//~ );
				
				//~ window.localFormatSaver.scriptsarr[i].scriptObject.lastRunStatus = res?.runStatus;
				//~ if (res?.runStatus) {
					//~ window.localFormatSaver.scriptsarr[i].scriptObject.lastRunResult = res.runResult;
				//~ } 					
			//~ } else {
				//~ window.localFormatSaver.scriptsarr[i].scriptObject.lastRunStatus = null;
			//~ }
			//~ if (window.localFormatSaver.scriptsarr[i].isopen) {
				//~ OpenNewScriptTab(window.localFormatSaver.scriptsarr[i]);
			//~ } 
		//~ }
	//~ }
	
	await OpenAndReRunAllLocalScripts();
	updateOwnFormatDialogData();
	//~ if (activetabs.length>0) {
		//~ activetabs[0].contenttab.show();
	//~ }
	
};

// ================================================================== exportdatabasemenuaction menu action

const exportDatabaseAction = async () => {   
	const dirHandle = await window.fileiohandler.openDirectoryHandleFromDialog();
	await window.localFormatSaver.exportDuckDbToDir(dirHandle);
}
// ================================================================== importdatabasemenuaction menu action

const importDatabaseAction = async () => {   
	const dirHandle = await window.fileiohandler.openDirectoryHandleFromDialog("read");
	await window.localFormatSaver.importDuckDBFromDir(dirHandle);
}

// ================================================================== exportDatabaseToProjectFileAction menu action

const exportDatabaseToProjectFileAction = async () => {   
	await SaveProjectFile();
	let path = await window.localFormatSaver.exportDuckDbToOwnFormat();
	if (path) { 
		let filesaveasdialog = new FileDownLoadDialog({fileSystemHandler: window.fileiohandler});
		await filesaveasdialog.downloadFromFSPath(path); 
	}
}

// ================================================================== importdatabasemenuaction menu action

const ImportDatabaseFromProjectFileAction = async () => {   

	await SaveProjectFile();	
	let importfilepath = `${PROJ_FILE_TEMP_PATH}/${PROJ_FILE_TEMP_NAME}`;
	// open file dialog
	// window.fileiohandler
	try {
		await window.fileiohandler.deleteFileFromFS(importfilepath);
		let uploadres = await projfilefileuploaddialog.uploadFilesButtonClick();
	//console.log("upload res = ", uploadres);
	//~ console.log("Calling importDuckDbFromOwnFormat");
		let importres = await window.localFormatSaver.importDuckDbFromOwnFormat(importfilepath);
		
		if (importres) {
			// close all open script windows if importres
			
			// load local project file to open all scripts
			tabNavStatusTab.contenttab.show();
			while (activetabs.length>0) {
				activetabs[0].destroy();
				activetabs.splice(0,1);
			}
			await OpenAndReRunAllLocalScripts();
			updateOwnFormatDialogData();
		}
		
    
	} catch (err) {
		console.log("Error importing a project file: ",err);
	}
	
}

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
		} else if (eventdata?.menuItemId === "exportdatabasemenuaction") { 
			//console.log("saveprojectfilemenuaction");
			exportDatabaseAction(); 
		} else if (eventdata?.menuItemId === "importdatabasemenuaction") { 
			//console.log("saveprojectfilemenuaction");
			importDatabaseAction(); 
		} else if (eventdata?.menuItemId === "exportprojectfilewithdbmenuaction") { 
			//console.log("saveprojectfilemenuaction");
			exportDatabaseToProjectFileAction(); 
		} else if (eventdata?.menuItemId === "importprojectfilewithdbmenuaction") { 
			//console.log("saveprojectfilemenuaction");
			ImportDatabaseFromProjectFileAction(); 
		} 
		
		//   
		
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



