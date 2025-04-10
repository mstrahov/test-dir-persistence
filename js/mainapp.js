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



console.log("test main app");

// =====  Interface layout

const tabnavcontrol = new TabNavigationControl({templateid: "#navtabscontroltemplate", containerid:"#tabnavcontrol"});
//window.testtabnav = tabnavcontrol; 

let tabNavStatusTab = tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:0, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#statusTabNavItemTemplate", tabbody: "App status" });
let tabNavMainMenuTab = tabnavcontrol.addNewTab(DropDownTabControl, {insertBeforePosition:0,  navitemtemplateid: "#mainmenuTabNavItemTemplate", });

let mainMenuControl = new MenuEventsControl({dropDownMenuElementId:tabNavMainMenuTab.DropDownMenuElementSelector, parentUUID: tabNavMainMenuTab.uuid, multiLevelMenu:false});
mainMenuControl.eventbus.subscribe('menuitemclick',(obj,eventdata)=>{ 
		console.log("mainmenuitemclick",obj,eventdata); 
	});

//tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:-1, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 1" , tabbody: "tab 1 body here" });
//tabnavcontrol.addNewTab(BaseTabControl, {insertBeforePosition:-1, templateid: "#emptyTabContentTemplate", navitemtemplateid: "#emptyTabNavItemTemplate", tabtitle: "tab title 2" , tabbody: "tab 2 body here" });

const appstatusview = new AppStatusView({templateid: "#statusdisplaycontroltemplate", containerid: tabNavStatusTab.TabNavTitleElementSelector });

// newAppMenu templates :  #menuAppTab01
const newAppPage = new AppPageControl( { 
			tabnavcontrol: tabnavcontrol,  
			baseTabControlType:BaseTabControl, 
			insertBeforePosition:-1, 
			templateid: "#emptyTabContentTemplate", 
			navitemtemplateid: "#emptyTabNavItemTemplate", 
			tabtitle: "New App Page 1" , 
			DropDownMenuTemplateID: "#menuAppTab01",
		});

newAppPage.addGridItem(GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Py code editor", griditemoptions: {w:6,h:5,} });


// =====  duckdb & pyodide

window.duckdb = new DuckDBLoader();
window.pyodideloader = new PyodideLoader();

window.duckdb.eventbus.subscribe('dbstatechange',(obj,eventdata)=>{ /* console.log("dbstatechange",obj,eventdata); */  appstatusview.duckdbStatusChange(eventdata); });
window.pyodideloader.eventbus.subscribe('pyodidestatechange',(obj,eventdata)=>{ /* console.log("pyodidestatechange",obj,eventdata); */  appstatusview.pyodideStatusChange(eventdata); });



window.dbconnReadyPromise = window.duckdb.init();
window.pyodideReadyPromise = window.pyodideloader.init();
