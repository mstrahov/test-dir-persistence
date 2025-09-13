/*******************
 * AppPageScriptControl - 
 * 
 * 
 * Requirements:  bootstrap5, gridstack.js
 * 
 * ****************************/

import { AppPageControl } from "./apppagecontrol.js";
import { GridItemPyEditor } from  "./griditempyeditor.js";
import { GridItemSQLEditor } from  "./griditemsqleditor.js";
import { StatusGridItemTextOutput } from "./griditemtextoutput.js";
import { gridItemScript, TransformScriptInit } from "./griditemscript.js";
import { gridItemSelectFileDialog } from "./griditemselectfiledialog.js";
// import { griditemTableDFPaged } from "./griditemtabledfpaged.js";
import { griditemTableDFPagedTransform } from "./griditemtabledfpagedtransform.js";
import { GridItemHTMLOutput } from "./griditemhtmloutput.js";
import { gridItemQueryView } from  "./griditemqueryview.js";
import { gridItemTableProps } from  "./griditemtableprops.js";
import { gridItemStaticQueryView } from  "./griditemstaticqueryview.js";
import { gridItemStaticQueryTreeView } from  "./griditemstaticquerytreeview.js";
import { gridItemDBView } from './griditemdbview.js';

export class AppPageScriptControl extends AppPageControl {
	#tablePickerDialog;
	#modalInputDialog;
	
	constructor (params) {
		if (params.scriptobj && params.scriptobj.objuuid) {
			params.uuid = params.scriptobj.objuuid;
		}
		super(params);
		this.fileIOHandler = params.fileIOHandler;
		this.#tablePickerDialog = params.tablePickerDialog;
		this.initscriptobj = params.scriptobj;
		this.scriptObject = params.transformScript?params.transformScript:TransformScriptInit();
		this.#modalInputDialog = params.modalInputDialog;
		this.visualwidgets = [];
		this.closedwidgets = [];
		this.staticqueryviews = [];
		this.initiallayout = params.initiallayout?params.initiallayout:1;
		let that = this; 
		this.sqleditor = undefined;
		this.sqlqueryview = undefined;
		this.tablepropseditor = undefined;
		this.griditemdbview = undefined;
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.topDropDownMenuEventHandler.bind(this));
		
		/* Widget groups:
		 * "gridItemScript", "GridItemPyEditor", "StatusGridItemTextOutput", "griditemTableDFPagedTransform", "gridItemSelectFileDialog"
		 * "GridItemSQLEditor", "StatusGridItemTextOutput", "gridItemQueryView"
		 * 
		 * 
		 **/
		let initialwidgetslist = [];
		if (this.initiallayout===1) {
			initialwidgetslist = ["gridItemScript", "GridItemPyEditor", "StatusGridItemTextOutput", "griditemTableDFPagedTransform", "gridItemSelectFileDialog"];
		} else if (this.initiallayout===2) {
			initialwidgetslist = ["gridItemDBView","GridItemSQLEditor", "StatusGridItemTextOutput", "gridItemQueryView"];
		}
		
		if (!this.initscriptobj) {
			
			for (let i=0;i<initialwidgetslist.length;i++) {
				this.addMainWidget(initialwidgetslist[i]);
			}
			
			//~ this.scriptControl = this.addGridItem( gridItemScript,   
				//~ {	
					//~ templateid:"#gridItemScriptDialog", 
					//~ headertext: "Script", 
					//~ griditemoptions: {w:6,h:5,},
					//~ transformscript: this.scriptObject,
					//~ scriptname: "",
				//~ }
			//~ );
			//~ this.setTabTitle(this.scriptControl.transformscript.scriptName);
			
			//~ this.pyeditor = this.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonScriptControlCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
			//~ this.pyeditor.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
			
			//~ this.dfview = this.addGridItem( griditemTableDFPagedTransform, {templateid:"#gridItemDFtransformview", headertext: "DataFrame edit view", griditemoptions: {w:6,h:5,},
				//~ coderunner: this.coderunner,
				//~ parentuuid: this.uuid
			//~ });
			//~ // closegriditem 
			//~ this.dfview.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
			
			//~ this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
			//~ this.statusTabOutput.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);

			
			//~ // ---------------   gridItemSelectFileDialog ---------------------
			//~ this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, {templateid:"#gridItemFileDialog", headertext: "File selection", griditemoptions: {w:6,h:5,}, 
				//~ fileIOHandler: this.fileIOHandler 
			//~ });
					
			//~ this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
			//~ this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
				//~ await that.addImportFileStep(eventdata); 
				//~ await that.runScriptOneStep(eventdata); 
			//~ }, this.scriptControl.uuid);
			//~ this.selectFileDialog.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
			
			//~ // ----------------------------------------------------------------

			//~ // ----------------------------------------------------------------
			
			//~ this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			//~ this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			//~ this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.statusTabOutput.runExecutionFailure(eventdata);  }, this.statusTabOutput.uuid);
			//~ this.eventbus.subscribe('getVariableError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			
			//~ this.scriptControl.eventbus.subscribe('runonecodestepaction',(obj,eventdata)=>{  that.runScriptOneStep(eventdata); }, this.uuid);
			//~ this.scriptControl.eventbus.subscribe('runallcodestepsaction',(obj,eventdata)=>{  that.runScriptAllSteps(eventdata); }, this.uuid);
			
			//~ this.scriptControl.eventbus.subscribe('showscriptaspythoneditable',(obj,eventdata)=>{  that.pyeditor.setValue(eventdata?.pycode); }, this.pyeditor.uuid);
			
			//~ this.scriptControl.eventbus.subscribe('loadfrompythonscript',(obj,eventdata)=>{  that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue()); }, this.pyeditor.uuid);
			//~ this.scriptControl.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
			
			
			//~ this.pyeditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ that.runCmdFromGridItem('py',obj,eventdata);  }, this.uuid);
			//~ this.pyeditor.eventbus.subscribe('clickableactionclick',(obj,eventdata)=>{ 
				//~ if (eventdata?.menuItemId === "syncaction") {
					//~ that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue());  
				//~ }
			//~ }, this.uuid);
			
			//~ this.dfview.eventbus.subscribe('cmdActionEvent',async (obj,eventdata)=>{  
				//~ await that.scriptControl.addScriptStep(eventdata);
				//~ await that.runScriptOneStep(eventdata); 
			//~ }, this.scriptControl.uuid);
			
			//~ this.dfview.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			//~ this.dfview.eventbus.subscribe('requestDataFrameChange',this.dfViewDataFrameChange.bind(this), this.uuid);
			
			
			//~ this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
			//~ this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
			//~ this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
			
		} else {
			
			try {
				this.scriptObject = JSON.parse(JSON.stringify(this.initscriptobj.scriptObject));
			} catch (err) {
				console.error("Unable to clone script object: ", err);
			}	
			this.setTabTitle(this.scriptObject.scriptName);
			// execute script before adding widgets ?
			if (this.scriptObject?.transformSteps?.length>0) {
				//this.runScriptAllSteps();	
			}
			
			// widgets layout
			let gridlayout = null;
			try {
				gridlayout = JSON.parse(this.initscriptobj.gridlayout);
			} catch (err) {
				console.error("Unable to restore grid layout: ", err);
			}	
			
			// add closed widgets
			if (this.initscriptobj.closedwidgets) {
				this.closedwidgets = JSON.parse(JSON.stringify(this.initscriptobj.closedwidgets));
			} 
			
			// add widgets
			for (let i=0;i<this.initscriptobj?.gridwidgets?.length;i++) {
				
				let gridlayoutoptions = {w:6,h:5};
				const ind1 = gridlayout.children.findIndex((v)=>v.id===this.initscriptobj.gridwidgets[i].uuid);
				if (ind1>-1) {
					if (!gridlayout.children[ind1].w) {
						gridlayout.children[ind1].w = 1;
					}
					if (!gridlayout.children[ind1].h) {
						gridlayout.children[ind1].h = 1;
					}
					gridlayoutoptions.w = gridlayout.children[ind1].w;
					gridlayoutoptions.h = gridlayout.children[ind1].h;
					gridlayoutoptions.x = gridlayout.children[ind1].x;
					gridlayoutoptions.y = gridlayout.children[ind1].y;
				}
				console.log("LAYOUT:", this.initscriptobj.gridwidgets[i].griditemheader, gridlayoutoptions);
				if (this.initscriptobj.gridwidgets[i].griditemname==="gridItemScript") {
					this.scriptControl = this.addGridItem( gridItemScript, 
						{	
							templateid:"#gridItemScriptDialog", 
							headertext: this.initscriptobj.gridwidgets[i].griditemheader,   
							columnlayout:  this.initscriptobj.gridwidgets[i].columnlayout,  
							griditemoptions: gridlayoutoptions,
							transformscript: this.scriptObject,
							scriptname: this.scriptObject.scriptName,
						}
					);
					this.scriptControl.eventbus.subscribe('runonecodestepaction',(obj,eventdata)=>{  that.runScriptOneStep(eventdata); }, this.uuid);
					this.scriptControl.eventbus.subscribe('runallcodestepsaction',(obj,eventdata)=>{  that.runScriptAllSteps(eventdata); }, this.uuid);
					this.scriptControl.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
					
				} else if (this.initscriptobj.gridwidgets[i].griditemname==="GridItemPyEditor") {
					this.pyeditor = this.addGridItem( GridItemPyEditor, 
						{
							templateid:"#gridItemPythonScriptControlCodeEditor", 
							headertext: this.initscriptobj.gridwidgets[i].griditemheader, 
							griditemoptions: gridlayoutoptions,
							editorhistory: this.initscriptobj.gridwidgets[i].cmdhistory,
						});
					this.pyeditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ that.runCmdFromGridItem('py',obj,eventdata);  }, this.uuid);
					this.pyeditor.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
						
				} else if (this.initscriptobj.gridwidgets[i].griditemname==="griditemTableDFPagedTransform") {
					this.dfview = this.addGridItem( griditemTableDFPagedTransform, 
						{
							templateid:"#gridItemDFtransformview", 
							headertext: this.initscriptobj.gridwidgets[i].griditemheader, 
							griditemoptions: gridlayoutoptions,
							columnlayout:  this.initscriptobj.gridwidgets[i].columnlayout,  
							dfname: this.initscriptobj.gridwidgets[i].dfname, 
							coderunner: this.coderunner,
							parentuuid: this.uuid,
						});
					this.dfview.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
					this.dfview.eventbus.subscribe('requestDataFrameChange',this.dfViewDataFrameChange.bind(this), this.uuid);
					this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
					this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
					this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
					
						
				} else if (this.initscriptobj.gridwidgets[i].griditemname==="StatusGridItemTextOutput") {
					this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, 
						{
							templateid:"#gridItemTextOutput", 
							headertext: this.initscriptobj.gridwidgets[i].griditemheader, 
							griditemoptions: gridlayoutoptions,
						});
					this.statusTabOutput.eventbus.subscribe('closegriditem', (obj,eventdata)=>{  that.deleteMainWidget(obj, eventdata );  }, this.uuid);
					this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
					this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
					this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.statusTabOutput.runExecutionFailure(eventdata);  }, this.statusTabOutput.uuid);
					this.eventbus.subscribe('getVariableError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			
				} else if (this.initscriptobj.gridwidgets[i].griditemname==="gridItemSelectFileDialog") {
					this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, 
						{
							templateid:"#gridItemFileDialog", 
							headertext: this.initscriptobj.gridwidgets[i].griditemheader, 
							griditemoptions: gridlayoutoptions, 
							fileIOHandler: this.fileIOHandler,
							columnlayout:  this.initscriptobj.gridwidgets[i].columnlayout,  
						});
					this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
					this.selectFileDialog.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
						
				} else if (this.initscriptobj.gridwidgets[i].griditemname==="GridItemHTMLOutput") {
					const id2 = this.initscriptobj.visualwidgets.findIndex((v)=>v.widgetObj.uuid===this.initscriptobj.gridwidgets[i].uuid);
					if (id2>-1) {
						const newWidgetObject = this.addGridItem( GridItemHTMLOutput, 
							{	
								templateid:"#gridItemHTMLView", 
								headertext: this.initscriptobj.gridwidgets[i].griditemheader, 
								griditemoptions: gridlayoutoptions, 
							});
						newWidgetObject.eventbus.subscribe('contentsRefreshRequest', this.refreshVisualWidget.bind(this), this.uuid);
						newWidgetObject.eventbus.subscribe('closegriditemRequest', this.deleteVisualWidget.bind(this), this.uuid);
						this.visualwidgets.push({
							...this.initscriptobj.visualwidgets[id2],
							widgetObject : newWidgetObject,
						});
						newWidgetObject.eventbus.dispatch('contentsRefreshRequest', newWidgetObject, { elementheight: newWidgetObject.getBodyElementHeight() });
					} else {
						console.error("Cannot add visual widget: ", this.initscriptobj.gridwidgets[i]);
					}
					
				}  else if (this.initscriptobj.gridwidgets[i].griditemname==="gridItemStaticQueryView") {
					const id2 = this.initscriptobj.staticqueryviews.findIndex((v)=>v.widgetObj.uuid===this.initscriptobj.gridwidgets[i].uuid);
					if (id2>-1) {
						const newWidgetObject = this.addGridItem( gridItemStaticQueryView, 
								{	templateid:"#gridItemSQLStaticQueryView", 
									headertext: this.initscriptobj.staticqueryviews[id2].headertext, 
									griditemoptions: gridlayoutoptions,
									columnlayout:  this.initscriptobj.staticqueryviews[id2].widgetObj.columnlayout?JSON.parse(JSON.stringify(this.initscriptobj.staticqueryviews[id2].widgetObj.columnlayout)):undefined,  
									usercolumnlayout: this.initscriptobj.staticqueryviews[id2].widgetObj.usercolumnlayout?JSON.parse(JSON.stringify(this.initscriptobj.staticqueryviews[id2].widgetObj.usercolumnlayout)):undefined,
									preferuserlayout: this.initscriptobj.staticqueryviews[id2].widgetObj.preferuserlayout,
									sqlcommand: this.initscriptobj.staticqueryviews[id2].widgetObj.sqlcommand,  
									coderunner: this.coderunner,
									parentuuid: this.uuid,
								});
						newWidgetObject.eventbus.subscribe('closegriditem', this.deleteStaticQueryViewWidget.bind(this), this.uuid);
						newWidgetObject.eventbus.subscribe('edittablelayoutgriditem', this.editLayoutStaticQueryViewWidget.bind(this), this.uuid);
						this.staticqueryviews.push({
							...this.initscriptobj.staticqueryviews[id2],
							widgetObject : newWidgetObject,
						});
						
					} else {
						console.error("Cannot add static query view widget: ", this.initscriptobj.gridwidgets[i]);
					}
				}  else if (this.initscriptobj.gridwidgets[i].griditemname==="gridItemStaticQueryTreeView") {
					const id2 = this.initscriptobj.staticqueryviews.findIndex((v)=>v.widgetObj.uuid===this.initscriptobj.gridwidgets[i].uuid);
					if (id2>-1) {
						const newWidgetObject = this.addGridItem( gridItemStaticQueryTreeView, 
								{	templateid:"#gridItemSQLStaticQueryTreeView", 
									headertext: this.initscriptobj.staticqueryviews[id2].headertext, 
									griditemoptions: gridlayoutoptions,
									columnlayout:  this.initscriptobj.staticqueryviews[id2].widgetObj.columnlayout?JSON.parse(JSON.stringify(this.initscriptobj.staticqueryviews[id2].widgetObj.columnlayout)):undefined,  
									usercolumnlayout: this.initscriptobj.staticqueryviews[id2].widgetObj.usercolumnlayout?JSON.parse(JSON.stringify(this.initscriptobj.staticqueryviews[id2].widgetObj.usercolumnlayout)):undefined,
									preferuserlayout: this.initscriptobj.staticqueryviews[id2].widgetObj.preferuserlayout,
									sqlcommand: this.initscriptobj.staticqueryviews[id2].widgetObj.sqlcommand,  
									coderunner: this.coderunner,
									parentuuid: this.uuid,
								});
						newWidgetObject.eventbus.subscribe('closegriditem', this.deleteStaticQueryViewWidget.bind(this), this.uuid);
						newWidgetObject.eventbus.subscribe('edittablelayoutgriditem', this.editLayoutStaticQueryViewWidget.bind(this), this.uuid);
						this.staticqueryviews.push({
							...this.initscriptobj.staticqueryviews[id2],
							widgetObject : newWidgetObject,
						});
						
					} else {
						console.error("Cannot add static query view widget: ", this.initscriptobj.gridwidgets[i]);
					}
				} else /* if (this.initscriptobj.gridwidgets[i].griditemname==="gridItemQueryView" ) */ {
					//GridItemSQLEditor
					this.addMainWidget(this.initscriptobj.gridwidgets[i].griditemname, this.initscriptobj.gridwidgets[i], gridlayoutoptions);	
				}  
				
			}
			// events
			if (this.scriptControl) {
				if (this.pyeditor) {
					this.pyeditor.eventbus.subscribe('clickableactionclick',(obj,eventdata)=>{ 
						if (eventdata?.menuItemId === "syncaction") {
							that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue());  
						}
					}, this.scriptControl.uuid);
					
					this.scriptControl.eventbus.subscribe('showscriptaspythoneditable',(obj,eventdata)=>{  that.pyeditor.setValue(eventdata?.pycode); }, this.pyeditor.uuid);
					this.scriptControl.eventbus.subscribe('loadfrompythonscript',(obj,eventdata)=>{  that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue()); }, this.pyeditor.uuid);
				}
				
				if (this.selectFileDialog) {
					this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
						await that.addImportFileStep(eventdata); 
						await that.runScriptOneStep(eventdata); 
					}, this.scriptControl.uuid);
				}
			
				if (this.dfview) {
					this.dfview.eventbus.subscribe('cmdActionEvent',async (obj,eventdata)=>{  
						await that.scriptControl.addScriptStep(eventdata);
						await that.runScriptOneStep(eventdata); 
					}, this.scriptControl.uuid);
					
					this.dfview.showdf(); 
				}
			}
			
			if (this.statusTabOutput && this.dfview) {
				this.dfview.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
			}
			
		}
	}
	// --------------------------------------------------------------------------------
	async init() {
			
	}
	// --------------------------------------------------------------------------------	
	async refreshVisualWidget(obj,eventdata) {
		const widgetIndex = this.visualwidgets.findIndex((v)=>v.widgetObject===obj);
		if (widgetIndex>-1) {
			let contentsData = await this.coderunner.getVariableVisualValue(this.visualwidgets[widgetIndex], eventdata.elementheight);
			if (contentsData.runStatus) {
				this.visualwidgets[widgetIndex].widgetObject.setContents(contentsData);
			} else {
				this.eventbus.dispatch('getVariableError', this, 
					{ targetEnv: this.visualwidgets[widgetIndex].targetEnv, cmd: '', result: contentsData, 
						msg: `Error refreshing widget data for variable ${this.visualwidgets[widgetIndex].varName}`, 
				});
			} 
		} else {
			console.error("Widget to refresh not found!");
		}
	}
	
	// --------------------------------------------------------------------------------	
	async deleteVisualWidget(obj,eventdata) {
		//~ { 
			//~ targetEnv: "py",
			//~ namespaceuuid: namespaceuuid,
			//~ headertext: namespacekeys[i],
			//~ varName: namespacekeys[i],
			//~ varType: "Figure",
			//~ widgetObject: null,
		//~ }
		const widgetIndex = this.visualwidgets.findIndex((v)=>v.widgetObject===obj);
		if (widgetIndex>-1) {
			// console.log("Close request from "+this.visualwidgets[widgetIndex].widgetObject.widgetName + " id: " + this.visualwidgets[widgetIndex].widgetObject.uuid );
			let widgetuuid = this.visualwidgets[widgetIndex].widgetObject.uuid;
			this.fileIOHandler.eventbus.unsubscribeUUID(widgetuuid);
			await this.destroyGridItem(this.visualwidgets[widgetIndex].widgetObject);
			delete this.visualwidgets[widgetIndex].widgetObject;
			this.visualwidgets.splice(widgetIndex, 1);
			
		} else {
			console.error("Widget to delete not found!");
		}
	}
	// --------------------------------------------------------------------------------	
	async deleteStaticQueryViewWidget(obj,eventdata) {
		//~ { 
			//~ targetEnv: "py",
			//~ namespaceuuid: namespaceuuid,
			//~ headertext: namespacekeys[i],
			//~ varName: namespacekeys[i],
			//~ varType: "Figure",
			//~ widgetObject: null,
		//~ }
		const widgetIndex = this.staticqueryviews.findIndex((v)=>v.widgetObject===obj);
		if (widgetIndex>-1) {
			// console.log("Close request from "+this.visualwidgets[widgetIndex].widgetObject.widgetName + " id: " + this.visualwidgets[widgetIndex].widgetObject.uuid );
			let widgetuuid = this.staticqueryviews[widgetIndex].widgetObject.uuid;
			this.fileIOHandler.eventbus.unsubscribeUUID(widgetuuid);
			await this.destroyGridItem(this.staticqueryviews[widgetIndex].widgetObject);
			delete this.staticqueryviews[widgetIndex].widgetObject;
			this.staticqueryviews.splice(widgetIndex, 1);
			
		} else {
			console.error("Widget to delete not found!");
		}
	}
	// --------------------------------------------------------------------------------	
	async deleteMainWidget(obj, eventdata) {
		const mainWidgetName = obj.widgetName;
		let widgetuuid = obj.uuid;
		console.log("Removing object ", mainWidgetName, widgetuuid);
		
		if (mainWidgetName==="gridItemScript") {
			if (this.scriptControl) {
				this.scriptObject = this.scriptControl.transformscriptclone;
			}
		}
		
		let widgetSettings = obj.toOwnFormat();
		const ind = this.closedwidgets.findIndex((v)=>v.griditemname===mainWidgetName);
		if (ind>-1) {
			this.closedwidgets[ind] = widgetSettings;
		} else {
			this.closedwidgets.push(widgetSettings);
		}
		
		this.fileIOHandler.eventbus.unsubscribeUUID(widgetuuid);
		await this.destroyGridItem(obj);
		
		// *********************-------------------------------
		if (mainWidgetName==="gridItemScript") {
			this.scriptControl = null;
		} else if (mainWidgetName==="GridItemPyEditor") {
			this.pyeditor = null;
		} else if (mainWidgetName==="griditemTableDFPagedTransform") {
			this.dfview = null;
		} else if (mainWidgetName==="StatusGridItemTextOutput") {
			this.statusTabOutput = null;
		} else if (mainWidgetName==="gridItemSelectFileDialog") {
			this.selectFileDialog = null;
		} else if (mainWidgetName==="GridItemSQLEditor") {
			this.sqleditor = null;		
		} else if (mainWidgetName==="gridItemQueryView") {
			this.sqlqueryview = null;		
		} else if (mainWidgetName==="gridItemTableProps") {
			this.tablepropseditor = null;		
		} else if (mainWidgetName==="gridItemDBView") {
			this.griditemdbview = null;		
		} 
		
		
		// *********************--------------------------------
		console.log("grid items: ", this.gridItems);
		console.log("Removed object ", mainWidgetName, widgetuuid);
		console.log("Widget settings: ", this.closedwidgets);
	}
	
	// --------------------------------------------------------------------------------	
	addMainWidget(mainWidgetName, initWidgetSettings, initgridlayoutoptions) {
		
		let gridlayoutoptions = {w:6,h:5};
		if (initgridlayoutoptions) {
			gridlayoutoptions = initgridlayoutoptions;
		}
		let that = this;
		let widgetSettings = undefined;
		const ind = this.closedwidgets.findIndex((v)=>v.griditemname===mainWidgetName);
		if (ind>-1) {
			widgetSettings = this.closedwidgets[ind];
		}
		console.log("Found closed widget: ",widgetSettings);
		
		if (initWidgetSettings) {
			widgetSettings = initWidgetSettings;
		}
		
		if (mainWidgetName==="gridItemScript") {
			if (!this.scriptControl) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "Script";
					widgetSettings.columnlayout = undefined;
					widgetSettings.scriptname = "";
					widgetSettings.transformscript = {};	
				}
				this.scriptControl = this.addGridItem( gridItemScript, 
					{	
						templateid:"#gridItemScriptDialog", 
						headertext: widgetSettings.griditemheader,
						columnlayout:  widgetSettings.columnlayout,
						griditemoptions: gridlayoutoptions,
						transformscript: this.scriptObject,
						scriptname: this.scriptObject.scriptName,
					}
				);
				this.scriptControl.eventbus.subscribe('runonecodestepaction',(obj,eventdata)=>{  that.runScriptOneStep(eventdata); }, this.uuid);
				this.scriptControl.eventbus.subscribe('runallcodestepsaction',(obj,eventdata)=>{  that.runScriptAllSteps(eventdata); }, this.uuid);
				this.scriptControl.eventbus.subscribe('closegriditem', async (obj,eventdata)=>{  await that.deleteMainWidget(obj, eventdata );  }, this.uuid);
				// *************************
				if (this.scriptControl) {
					if (this.pyeditor) {
						this.pyeditor.eventbus.subscribe('clickableactionclick',(obj,eventdata)=>{ 
							if (eventdata?.menuItemId === "syncaction") {
								that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue());  
							}
						}, this.scriptControl.uuid);
						
						this.scriptControl.eventbus.subscribe('showscriptaspythoneditable',(obj,eventdata)=>{  that.pyeditor.setValue(eventdata?.pycode); }, this.pyeditor.uuid);
						this.scriptControl.eventbus.subscribe('loadfrompythonscript',(obj,eventdata)=>{  that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue()); }, this.pyeditor.uuid);
					}
					
					if (this.selectFileDialog) {
						this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
							await that.addImportFileStep(eventdata); 
							await that.runScriptOneStep(eventdata); 
						}, this.scriptControl.uuid);
					}
				
					if (this.dfview) {
						this.dfview.eventbus.subscribe('cmdActionEvent',async (obj,eventdata)=>{  
							await that.scriptControl.addScriptStep(eventdata);
							await that.runScriptOneStep(eventdata); 
						}, this.scriptControl.uuid);
						
						this.dfview.showdf(); 
					}
				}
				
				// *************************
			}
		} else if (mainWidgetName==="GridItemPyEditor") {
			// ------------------------------------
			if (!this.pyeditor) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "Python";
					widgetSettings.cmdhistory = undefined;
				}
				this.pyeditor = this.addGridItem( GridItemPyEditor, 
							{
								templateid:"#gridItemPythonScriptControlCodeEditor", 
								headertext: widgetSettings.griditemheader, 
								griditemoptions: gridlayoutoptions,
								editorhistory: widgetSettings.cmdhistory,
							});
				this.pyeditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ that.runCmdFromGridItem('py',obj,eventdata);  }, this.uuid);
				this.pyeditor.eventbus.subscribe('closegriditem', async (obj,eventdata)=>{  await that.deleteMainWidget(obj, eventdata );  }, this.uuid);
				//*****************
				if (this.scriptControl) {
					if (this.pyeditor) {
						this.pyeditor.eventbus.subscribe('clickableactionclick',(obj,eventdata)=>{ 
							if (eventdata?.menuItemId === "syncaction") {
								that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue());  
							}
						}, this.scriptControl.uuid);
						
						this.scriptControl.eventbus.subscribe('showscriptaspythoneditable',(obj,eventdata)=>{  that.pyeditor.setValue(eventdata?.pycode); }, this.pyeditor.uuid);
						this.scriptControl.eventbus.subscribe('loadfrompythonscript',(obj,eventdata)=>{  that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue()); }, this.pyeditor.uuid);
					}
				}
				//****************
			}
			// ------------------------------------
		} else if (mainWidgetName==="griditemTableDFPagedTransform") {
			// ------------------------------------
			if (!this.dfview) {
				// ------------------------------------
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "DataFrame edit view";
					widgetSettings.columnlayout = undefined;
					widgetSettings.dfname = undefined;
				}
				this.dfview = this.addGridItem( griditemTableDFPagedTransform, 
						{
							templateid:"#gridItemDFtransformview", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
							columnlayout:  widgetSettings.columnlayout,  
							dfname: widgetSettings.dfname, 
							coderunner: this.coderunner,
							parentuuid: this.uuid,
						});
				this.dfview.eventbus.subscribe('requestDataFrameChange',this.dfViewDataFrameChange.bind(this), this.uuid);
				this.dfview.eventbus.subscribe('closegriditem', async (obj,eventdata)=>{ await that.deleteMainWidget(obj, eventdata);  }, this.uuid);
				this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				
				// ***************************************
				if (this.scriptControl) {
					if (this.dfview) {
						this.dfview.eventbus.subscribe('cmdActionEvent',async (obj,eventdata)=>{  
							await that.scriptControl.addScriptStep(eventdata);
							await that.runScriptOneStep(eventdata); 
						}, this.scriptControl.uuid);
						
						this.dfview.showdf(); 
					}
				}
				
				if (this.statusTabOutput && this.dfview) {
					this.dfview.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
				}
				
				// ****************************************
				
				// ------------------------------------
			}
		} else if (mainWidgetName==="StatusGridItemTextOutput") {
			if (!this.statusTabOutput) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "Output";
				}
				
				this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, 
						{
							templateid:"#gridItemTextOutput", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
						});
				this.statusTabOutput.eventbus.subscribe('closegriditem', async (obj,eventdata)=>{  await that.deleteMainWidget(obj, eventdata );  }, this.uuid);
				this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
				this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
				this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.statusTabOutput.runExecutionFailure(eventdata);  }, this.statusTabOutput.uuid);
				this.eventbus.subscribe('getVariableError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
				//*****************
				
				if (this.statusTabOutput && this.dfview) {
					this.dfview.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
				}
				//*****************
			}
			
		} else if (mainWidgetName==="gridItemSelectFileDialog") {
			// ------------------------------------
			if (!this.selectFileDialog) {
				if (!widgetSettings) {
						widgetSettings = {};
						widgetSettings.griditemheader = "File selection";
						widgetSettings.columnlayout = undefined;
					}
					
				this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, 
							{
								templateid:"#gridItemFileDialog", 
								headertext: widgetSettings.griditemheader, 
								griditemoptions: gridlayoutoptions, 
								fileIOHandler: this.fileIOHandler,
								columnlayout:  widgetSettings.columnlayout,  
							});
				this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
				this.selectFileDialog.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
				
				// **********************************************
				if (this.scriptControl) {
					if (this.selectFileDialog) {
						this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
							await that.addImportFileStep(eventdata); 
							await that.runScriptOneStep(eventdata); 
						}, this.scriptControl.uuid);
					}
				}
				// **********************************************
			}
		} else if (mainWidgetName==="GridItemSQLEditor") {
			if (!this.sqleditor) {
			// this.sqleditor = tabNavStatusTab.addGridItem( GridItemSQLEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "SQL", griditemoptions: {w:6,h:7,} });	
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "SQL";
					widgetSettings.cmdhistory = undefined;
				}
				this.sqleditor = this.addGridItem( GridItemSQLEditor, 
						{
							templateid:"#gridItemPythonCodeEditor", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
							editorhistory: widgetSettings.cmdhistory,
						});
				this.sqleditor.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
				this.sqleditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ that.runCmdFromGridItem('sql',obj,eventdata);  }, this.uuid);
				if (this.sqlqueryview) {
					this.sqlqueryview.eventbus.subscribe('editSQLcommandgriditem',(obj,eventdata)=>{  that.sqleditor.setValue(eventdata?.sqlcommand); }, this.sqleditor.uuid);
				}
				
				this.eventbus.subscribe('sendTextToSQLEditor',(obj,eventdata)=>{  that.sqleditor.insertStringAtCursor(eventdata?.textToSend); }, this.sqleditor.uuid);
				
			}	
		} else if (mainWidgetName==="gridItemQueryView") {
			if (!this.sqlqueryview) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "SQL Query Result";
					widgetSettings.columnlayout = undefined;
					widgetSettings.usercolumnlayout = undefined;
					
				}
				this.sqlqueryview  = this.addGridItem( gridItemQueryView , 
						{
							templateid:"#gridItemSQLQueryView", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
							columnlayout:  widgetSettings.columnlayout,  
							usercolumnlayout: widgetSettings.usercolumnlayout,
							sqlcommand: widgetSettings.sqlcommand,  
							coderunner: this.coderunner,
							parentuuid: this.uuid,
						});
				this.sqlqueryview.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
				// 
				this.sqlqueryview.eventbus.subscribe('editcolumnsgriditem', this.editTabulatorColumns.bind(this), this.uuid);
				this.sqlqueryview.eventbus.subscribe('clonethistablegriditem', this.cloneQueryView.bind(this), this.uuid);
				this.sqlqueryview.eventbus.subscribe('clonethistabletotreeviewgriditem', this.cloneQueryTreeView.bind(this), this.uuid);
				
				this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.sqlqueryview.processCodeRunnerResult(obj,eventdata);  }, this.sqlqueryview.uuid);
				// clonethistablegriditem
				
				//~ this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				//~ this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				if (this.sqleditor) {
					this.sqlqueryview.eventbus.subscribe('editSQLcommandgriditem',(obj,eventdata)=>{  that.sqleditor.setValue(eventdata?.sqlcommand); }, this.sqleditor.uuid);
				}
				
				
				
			}
		} else if (mainWidgetName==="gridItemTableProps") {
			if (!this.tablepropseditor) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "Column properties editor";
					widgetSettings.columnlayout = undefined;
					
				}
				this.tablepropseditor  = this.addGridItem( gridItemTableProps, 
						{
							templateid:"#gridItemTableProps", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
							columnlayout:  widgetSettings.columnlayout,  
							sqlcommand: widgetSettings.sqlcommand,  
							coderunner: this.coderunner,
							parentuuid: this.uuid,
						});
				this.tablepropseditor.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
				this.tablepropseditor.eventbus.subscribe('updatecolumnscmdgriditem', this.updateTabulatorColumnProperties.bind(this), this.uuid);
				// editSQLcommandgriditem
				//~ this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.sqlqueryview.processCodeRunnerResult(obj,eventdata);  }, this.sqlqueryview.uuid);
				//~ this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				//~ this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
				//~ if (this.sqleditor) {
					//~ this.sqlqueryview.eventbus.subscribe('editSQLcommandgriditem',(obj,eventdata)=>{  that.sqleditor.setValue(eventdata?.sqlcommand); }, this.sqleditor.uuid);
				//~ }

			}
		} else if (mainWidgetName==="gridItemDBView") {
	
			if (!this.griditemdbview) {
				if (!widgetSettings) {
					widgetSettings = {};
					widgetSettings.griditemheader = "DB objects";
					widgetSettings.columnlayout = undefined;
					
				}
				this.griditemdbview  = this.addGridItem( gridItemDBView, 
						{
							templateid:"#gridItemDBView", 
							headertext: widgetSettings.griditemheader, 
							griditemoptions: gridlayoutoptions,
							columnlayout:  widgetSettings.columnlayout,  
							sqlcommand: widgetSettings.sqlcommand,  
							coderunner: this.coderunner,
							parentuuid: this.uuid,
						});
				this.griditemdbview.eventbus.subscribe('closegriditem', this.deleteMainWidget.bind(this), this.uuid);
				this.griditemdbview.eventbus.subscribe('generatedTemplateEvent', this.sendTextToSQLEditor.bind(this), this.uuid);
			}
		}
		
	}
	
	// --------------------------------------------------------------------------------	
	async topDropDownMenuEventHandler(obj,eventdata) {
		//console.log("main drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "renameaction") {
			//console.log('renameaction');
			await this.renameScript();
		}
		else if (eventdata?.menuItemId === 'addchartwidget') {	
			console.log('addchartwidget');
			await this.addVisualWidget();
			
		} else if (eventdata?.menuItemId === 'savelayout') { 
			console.log("Visual widgets ", this.visualwidgets);
			console.log("Grid items ", this.gridItems);
			// {"w":2,"h":2,"id":"0f1ab445-6b02-4d9e-bdec-d0eac4eb311e","x":6,"y":6},  
			// but if size w=1,h=1: {"id":"0f1ab445-6b02-4d9e-bdec-d0eac4eb311e","x":6,"y":6},
			console.log("Script: ",this.scriptControl?this.scriptControl.transformscriptclone:this.scriptObject);
			console.log("Data table widgets ", this.staticqueryviews);
			this.eventbus.dispatch('savelayout', this, {} );
			
		} else if (eventdata?.menuItemId === 'adddftransformwidget') { 
			this.addMainWidget("griditemTableDFPagedTransform");
		} else if (eventdata?.menuItemId === 'addfilepickerwidget') { 
			this.addMainWidget("gridItemSelectFileDialog");
		} else if (eventdata?.menuItemId === 'addstatusoutputwidget') { 
			this.addMainWidget("StatusGridItemTextOutput");
		} else if (eventdata?.menuItemId === 'addpythoneditorwidget') { 
			this.addMainWidget("GridItemPyEditor");
		} else if (eventdata?.menuItemId === 'addsqleditorwidget') { 
			this.addMainWidget("GridItemSQLEditor");
		} else if (eventdata?.menuItemId === 'addsqlqueryviewwidget') { 
			this.addMainWidget("gridItemQueryView");
		} else if (eventdata?.menuItemId === 'addscriptstepswidget') { 
			this.addMainWidget("gridItemScript"); 
		} else if (eventdata?.menuItemId === 'adddatabaseviewwidget') { 
			this.addMainWidget("gridItemDBView"); 
		} else if (eventdata?.menuItemId === 'closebuttonaction') { 
			this.eventbus.dispatch('closebuttonaction', this, {} );
		} 
		
		//  
		//	this.grid.compact();   
		//} else if (eventdata?.menuItemId === 'savelayout') {   
		//	console.log(this.layoutToJSON());
		
		
	}
	
	// --------------------------------------------------------------------------------	
	
	async dfViewDataFrameChange(obj,eventdata) {
		console.log("Dataframe change request ", obj,eventdata);
		const currentDF = eventdata.dfname?eventdata.dfname:''; 
		
		// ----------------
		let varlist = await this.coderunner.getNameSpaceVarsOfType(this.appuuid,'DataFrame');
		varlist = varlist.filter((v)=>v.varName!==currentDF);
		console.log("Available variables: ",varlist);
		
		for (let i=0;i<varlist.length;i++) {
			varlist[i].id = i;
			varlist[i].headertext = "DataFrame edit view (" + varlist[i].headertext + ")";
		}
		
		let selectedOption;
		if (varlist.length>0) {
			const columns = [
				{ title: "Variable", field: "varName" },
				{ title: "Type", field: "varType" },
				{ title: "Widget Header (editable)", field: "headertext", editor:true, },
				//~ { title: "namespaceuuid", field: "namespaceuuid" },
				//~ { title: "targetEnv", field: "py" },
			 ];
			let tabulatoroptions = {
				data: varlist,
				columns: columns,
				dialogTitle : `Select an existing variable with data frame data, edit widget's header text:`, 
			};
			try {
				selectedOption = await this.#tablePickerDialog.showoptions(tabulatoroptions);
				console.log('Selected option:', selectedOption);
			} catch (error) {
				console.error('Error:', error.message);
			}
			// ------------------
			if (selectedOption) {
				obj.headerText = selectedOption.headertext;
				await obj.changeDataFrame(selectedOption.varName);
			}
			
		} else {
			const errormsg = 'Other data frame variables not found! Dataframe data can be set from existing variables in python script, containing DataFrame data.';
			console.log(errormsg);
			this.eventbus.dispatch('getVariableError', this, 
					{ targetEnv: 'py', cmd: '', result: null, 
						msg: errormsg, 
				});
			
		}
		
		
		
		//  ------------------
		
	}
	
	
	// --------------------------------------------------------------------------------
	async renameScript() {
		try {
			let curScriptName;
			if (this.scriptControl) {
				curScriptName = this.scriptControl.transformscript.scriptName; 
			} else if (this.scriptObject) {
				curScriptName = this.scriptObject.scriptName;
			}
			
			const props = {
				dialogTitle: "Script name:",
				inputOneLine: curScriptName,
				inputOneLinePlaceHolder: "Script name",
			};
			const selectedOption = await this.#modalInputDialog.showdialog(props);
			console.log('Return value:', selectedOption.inputOneLine);
			
			//~ this.scriptControl.transformscript.scriptName = selectedOption.inputOneLine.trim();
			//~ this.setTabTitle(selectedOption.inputOneLine.trim());
			if (selectedOption.inputOneLine.trim() !== curScriptName) {
				this.setScriptName(selectedOption.inputOneLine.trim());
				this.eventbus.dispatch('scriptnamechange', this, {
						fieldname: 'name', 
						oldvalue: curScriptName, 
						newvalue:selectedOption.inputOneLine.trim(), 
						scriptuuid: this.uuid,
						rowdata: { objuuid: this.uuid }, 
				});
			}
		} catch (error) {
			console.error('Error:', error.message);
		}

	}
	
	// --------------------------------------------------------------------------------
	async cloneQueryTreeView(obj, eventdata) {
		await this.cloneQueryView(obj, eventdata, 'DATATREE');
		
	} 
	// --------------------------------------------------------------------------------
	
	async cloneQueryView(obj, eventdata, queryType='PLAINTABLE') {
		let tableheader = "";
		
		if (!this.sqlqueryview) {
			return false;
		}
		
		// ** table headertext
		try {
			const props = {
				dialogTitle: "Enter table header:",
				inputOneLine: this.sqlqueryview.lastheadertext,
				inputOneLinePlaceHolder: "Table header",
			};
			const selectedOption = await this.#modalInputDialog.showdialog(props);
			tableheader = selectedOption.inputOneLine.trim();
			console.log('Return value for table header:', tableheader);
		} catch (error) {
			console.error('Error:', error.message);
		}
		// ****
		let usercolumnlayout;
		if (this.sqlqueryview.usercolumnlayout) {
			usercolumnlayout = JSON.parse(JSON.stringify(this.sqlqueryview.usercolumnlayout));
		} else {
			usercolumnlayout = this.sqlqueryview.getTabulatorColumnLayout();
		}
		
		let gridItemType;
		let gridItemTemplate;
		if (queryType==='DATATREE') {
			gridItemType = gridItemStaticQueryTreeView;
			gridItemTemplate = "#gridItemSQLStaticQueryTreeView";
		} else {
			gridItemType = gridItemStaticQueryView;
			gridItemTemplate = "#gridItemSQLStaticQueryView";
		}
		
		const newWidgetObject = this.addGridItem( gridItemType, 
				{	templateid: gridItemTemplate, 
					headertext: tableheader, 
					griditemoptions: {w:6,h:5,}, 
					columnlayout:  this.sqlqueryview.getTabulatorColumnLayout(),  
					usercolumnlayout: usercolumnlayout,
					preferuserlayout: true,
					sqlcommand: this.sqlqueryview.sqlcommand,  
					coderunner: this.coderunner,
					parentuuid: this.uuid,
				});
		//~ newWidgetObject.eventbus.subscribe('contentsRefreshRequest', this.refreshVisualWidget.bind(this), this.uuid);
		newWidgetObject.eventbus.subscribe('closegriditem', this.deleteStaticQueryViewWidget.bind(this), this.uuid);
		newWidgetObject.eventbus.subscribe('edittablelayoutgriditem', this.editLayoutStaticQueryViewWidget.bind(this), this.uuid);
		// edittablelayoutgriditem  
		this.staticqueryviews.push({
			headertext: tableheader,
			widgetObject : newWidgetObject,
		});
		//~ newWidgetObject.eventbus.dispatch('contentsRefreshRequest', newWidgetObject, { elementheight: newWidgetObject.getBodyElementHeight() });
		//~ newWidgetObject.refreshData();
		// ---
		
		
	}
	// --------------------------------------------------------------------------------
	
	async editLayoutStaticQueryViewWidget(obj,eventdata) {
		// add sql editor, add sql query view, add layout props view
		if (!obj) { return false; }
		let sqlqueryviewisopen = true;
		if (!this.sqlqueryview) {
			sqlqueryviewisopen = false;
		}
		this.addMainWidget("GridItemSQLEditor");
		this.addMainWidget("gridItemQueryView");
		
		if (!this.tablepropseditor) {
			this.addMainWidget("gridItemTableProps");
		}
		if (this.sqleditor) {
			this.sqleditor.setValue(obj.sqlcommand);
		}
		if (this.tablepropseditor) {
			this.tablepropseditor.updateColProps(obj.usercolumnlayout);
		}
		if (this.sqlqueryview) {
			this.sqlqueryview.sqlcommand = obj.sqlcommand;
			this.sqlqueryview.usercolumnlayout = JSON.parse(JSON.stringify(obj.usercolumnlayout));
			this.sqlqueryview.preferuserlayout = true;
			this.sqlqueryview.lastheadertext = obj.headerText;
			if (sqlqueryviewisopen) {
				await this.sqlqueryview.refreshData();   //  need to add a lock
			}
			//this.sqlqueryview.applyColumnLayout(obj.usercolumnlayout);
		}
		
	}
	
	// --------------------------------------------------------------------------------
	setScriptName(newName) {
		if (this.scriptControl) {
			this.scriptControl.transformscript.scriptName = newName;
		} else if (this.scriptObject) {
			this.scriptObject.scriptName = newName;;
		} 
		this.setTabTitle(newName);
	}
	
	// --------------------------------------------------------------------------------	
	async addVisualWidget() {
		//~ { 
			//~ targetEnv: "py",
			//~ namespaceuuid: namespaceuuid,
			//~ headertext: namespacekeys[i],
			//~ varName: namespacekeys[i],
			//~ varType: "Figure",
			//~ widgetObject: null,
		//~ }
		let varlist = await this.coderunner.getNameSpaceVars(this.appuuid);
		//console.log("Available variables: ",varlist);
		
		for (let i=0;i<varlist.length;i++) {
			varlist[i].id = i;
		}
		
		let selectedOption;
		if (varlist.length>0) {
			const columns = [
				{ title: "Variable", field: "varName" },
				{ title: "Type", field: "varType" },
				{ title: "Widget Header (editable)", field: "headertext", editor:true, },
				//~ { title: "namespaceuuid", field: "namespaceuuid" },
				//~ { title: "targetEnv", field: "py" },
			 ];
			let tabulatoroptions = {
				data: varlist,
				columns: columns,
				dialogTitle : `Select an existing variable with chart data, edit widget's header text:`, 
			};
			try {
				selectedOption = await this.#tablePickerDialog.showoptions(tabulatoroptions);
				console.log('Selected option:', selectedOption);
			} catch (error) {
				console.error('Error:', error.message);
			}
			// ------------------
			if (selectedOption) {
				// add VisualWidget to this.visualwidgets
				
				const newWidgetObject = this.addGridItem( GridItemHTMLOutput, {templateid:"#gridItemHTMLView", headertext: selectedOption.headertext, griditemoptions: {w:6,h:5,}, });
				newWidgetObject.eventbus.subscribe('contentsRefreshRequest', this.refreshVisualWidget.bind(this), this.uuid);
				newWidgetObject.eventbus.subscribe('closegriditemRequest', this.deleteVisualWidget.bind(this), this.uuid);
				this.visualwidgets.push({
					...selectedOption,
					widgetObject : newWidgetObject,
				});
				newWidgetObject.eventbus.dispatch('contentsRefreshRequest', newWidgetObject, { elementheight: newWidgetObject.getBodyElementHeight() });

			}
			
		} else {
			const errormsg = 'New visual widgets can be created from existing variables in python script, containing plotly figures or SVG chart sources.';
			console.log(errormsg);
			this.eventbus.dispatch('getVariableError', this, 
					{ targetEnv: 'py', cmd: '', result: null, 
						msg: errormsg, 
				});
			
		}
		
	}
	
	// --------------------------------------------------------------------------------	
	
	async runScriptOneStep(eventdata) {
		console.log("runScriptOneStep",eventdata);
		let scriptsteps = this.scriptControl?.transformscript?.transformSteps;
		
		if (!scriptsteps) {
			console.error('Error: no transform script found!');
			return false;
		} else if (scriptsteps.length===0) {
			console.log('Transform script is empty.');
			return false;
		}
		scriptsteps.sort((a,b)=>a.stepOrder-b.stepOrder);
		let steptorun = scriptsteps.findIndex((el)=>el.lastRunStatus!==true);
		if (steptorun===-1) {steptorun=0;}
		for (let i=steptorun;i<scriptsteps.length;i++) {
			scriptsteps[i].lastRunStatus = null;
		}
		console.log(scriptsteps, steptorun);
		
		
		let res;
		try {
			res = await this.runAsync(scriptsteps[steptorun].targetEnv, scriptsteps[steptorun].scriptCode);
			//console.log("Command run res: ", res);
			if (res?.runStatus) {
				scriptsteps[steptorun].lastRunStatus = true;
				scriptsteps[steptorun].lastRunResult = res.runResult;
				scriptsteps[steptorun].executionTime = res.executionTime;
				this.eventbus.dispatch('CmdExecutionSuccess', this, { targetEnv: scriptsteps[steptorun].targetEnv, cmd: scriptsteps[steptorun].scriptCode, result: res });
				
			} else {
				scriptsteps[steptorun].lastRunStatus = false;
				scriptsteps[steptorun].lastRunResult = res.errorshort;
				scriptsteps[steptorun].executionTime = res.executionTime;
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: scriptsteps[steptorun].targetEnv, cmd: scriptsteps[steptorun].scriptCode, result: res, msg: "Step execution error:", });
			}
		} catch (err) {
			console.error("Command run err ",err);
			scriptsteps[steptorun].lastRunStatus = false;
			scriptsteps[steptorun].lastRunResult = 'failed to run';
			scriptsteps[steptorun].executionTime = 0;
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: scriptsteps[steptorun].targetEnv, cmd: scriptsteps[steptorun].scriptCode, result: null, error: err, msg: "Step execution failed:", });
		}
		
		
	}
	
	// --------------------------------------------------------------------------------	
	
	async runScriptAllSteps(eventdata) {
		console.log("runScriptAllSteps",eventdata);
		let scriptsteps;
		if (!this.scriptControl) {
			scriptsteps = this.scriptObject?.transformSteps;
		} else {
			scriptsteps = this.scriptControl?.transformscript?.transformSteps;
		}
		
		if (!scriptsteps) {
			console.error('Error: no transform script found!');
			return false;
		} else if (scriptsteps.length===0) {
			console.log('Transform script is empty.');
			return false;
		}
		scriptsteps.sort((a,b)=>a.stepOrder-b.stepOrder);
		for (let i=0;i<scriptsteps.length;i++) {
			scriptsteps[i].lastRunStatus = null;
		}
		console.log("scriptsteps", scriptsteps);
		
		let res;
		try {
			res = await this.coderunner.runAsyncBatch(scriptsteps, this.appuuid); 
			//console.log("Command run res: ", res);
			if (res?.runStatus) {
				this.eventbus.dispatch('CmdExecutionSuccess', this, { targetEnv: res.targetEnv, cmd: '', result: res });
			} else {
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: res.targetEnv, cmd: '', result: res, msg: 'Script execution error:', });
			}
			
			if (res?.runresults && res?.runresults.length>0) {
				for (let j=0;j<res.runresults.length;j++) {
					let stepIndex = scriptsteps.findIndex((el)=>el.stepID===res.runresults[j].stepID);
					if (stepIndex>-1) {
						scriptsteps[stepIndex].lastRunStatus = res.runresults[j].runStatus;
						scriptsteps[stepIndex].lastRunResult = res.runresults[j].runResult;
						scriptsteps[stepIndex].executionTime = res.runresults[j].executionTime;
					}
					
				}
				
			}
			
		} catch (err) {
			console.error("Command run err ",err);
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: res.targetEnv, cmd: '', result: null, error: err, msg: 'Script execution failed:', });
		}
	}
	
	// --------------------------------------------------------------------------------
	async addImportFileStep(eventdata) {
		// {fullpath: row.getData().fullpath, filetype: row.getData().filetype   }
		console.log("add import file step",eventdata);
		if (eventdata?.filetype?.toLowerCase().startsWith("xls")) {
			await this.addImportExcelFileStep(eventdata);
		} else if (eventdata?.filetype?.toLowerCase() === 'parquet') {
			await this.addImportParquetFileStep(eventdata);
		} else if (eventdata?.filetype?.toLowerCase() === 'csv') {
			await this.addImportCSVFileStep(eventdata);
			
		} 
		
		
	}
	
	// --------------------------------------------------------------------------------
	async addImportParquetFileStep(eventdata) {
		if (!this.scriptControl) {
			this.addMainWidget("gridItemScript");
		}
		await this.scriptControl.addScriptStep({actionid:'ImportParquetFileToDF', parameters:{df:"df",filepath:eventdata.fullpath, }});
	}
	
	// --------------------------------------------------------------------------------
	async addImportCSVFileStep(eventdata) {
		if (!this.scriptControl) {
			this.addMainWidget("gridItemScript");
		}
		await this.scriptControl.addScriptStep({actionid:'ImportCSVFileToDF', parameters:{df:"df",filepath:eventdata.fullpath, }});
	}
	
	
	// --------------------------------------------------------------------------------
	async addImportExcelFileStep(eventdata) {
		// {fullpath: row.getData().fullpath, filetype: row.getData().filetype   }  
		const sheetinfocmd = `import openpyxl
workbook = openpyxl.open('${eventdata.fullpath}', read_only=True)
sheetinfo = []
for sheet in workbook:
	numrows = 0
	numcols = 0
	sheettitle = ""
	try:
		sheettitle = sheet.title
	except:
		sheettitle = "Sheet1"
	try:
		numrows = sheet.max_row - sheet.min_row + 1
		numcols = sheet.max_column - sheet.min_column + 1
	except:
		numrows = 0
		numcols = 0    
	sheetinfo.append({"sheetname":sheet.title, "numrows": numrows, "numcols": numcols })
workbook.close()
sheetinfo
`;
		let res = null;
		let sheetlist = [];
		try {
			res = await this.runAsync('py', sheetinfocmd);
			console.log("Command run res: ", res);
			if (res?.runStatus) {
				//console.log("sheets list ready");
				//window.testoutput = res.output;
				let r1 = res.output.toJs();
				for (let i=0;i<r1.length;i++) {
					sheetlist.push({id: i, sheetname: r1[i].sheetname, numrows: r1[i].numrows, numcols: r1[i].numcols });
				}
			} else {
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'py', cmd: sheetinfocmd, result: res, 
								msg: `Error fetching sheets from ${eventdata.fullpath} or not an Excel format.`, });
				console.log("Error fetching sheets from excel or not an excel", eventdata.fullpath);
			}
		} catch (err) {
			console.log("Excel import run err ",err);
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: 'py', cmd: sheetinfocmd, result: null, error: err, 
								msg: `Excel file ${eventdata.fullpath} import failed!` });
		}
		console.log(sheetlist);
		let selectedOption;
		if (sheetlist.length>0) {
			const columns = [
				{ title: "Sheet Name", field: "sheetname" },
				{ title: "Number Of Rows", field: "numrows" },
				{ title: "Number Of Columns", field: "numcols" },
			 ];
			let tabulatoroptions = {
				data: sheetlist,
				columns: columns,
				dialogTitle : `Select a sheet from ${eventdata.fullpath} :`, 
			};
			if (sheetlist.length>1) {    //  show select sheet dialog only if there're more than one sheet in a file
				try {
					selectedOption = await this.#tablePickerDialog.showoptions(tabulatoroptions);
					console.log('Selected option:', selectedOption);
				} catch (error) {
					console.error('Error:', error.message);
				}
			} else {
				selectedOption = sheetlist[0];
			}
			// ------------------
			if (selectedOption) {
				// that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:cell.getRow().getIndex(), colnum:colIndex-1}}  );
				// window.teststeps.addScriptStep(eventdata);
				if (!this.scriptControl) {
					this.addMainWidget("gridItemScript");
				}
				await this.scriptControl.addScriptStep({actionid:'ImportExcelFileToDF', parameters:{df:"df",filepath:eventdata.fullpath, sheetname:selectedOption.sheetname}});
				
			}
			
		}
		
		
	}
	// --------------------------------------------------------------------------------
	
	editTabulatorColumns(obj,eventdata) {
		console.log("editTabulatorColumns",obj,eventdata);
		if (!this.tablepropseditor) {
			this.addMainWidget("gridItemTableProps");
		}
		
		this.tablepropseditor.updateColProps(eventdata.columnlayout);
	}
	
	// -------------------------------------------------------------------------------
	
	updateTabulatorColumnProperties(obj,eventdata) {
			// updatecolumnscmdgriditem   newColumnProperties  
		if (this.sqlqueryview && eventdata?.newColumnProperties) {
			this.sqlqueryview.applyColumnLayout(eventdata.newColumnProperties);
		}
	}
	// --------------------------------------------------------------------------------
	
	sendTextToSQLEditor(obj,eventdata) {
		
		this.eventbus.dispatch('sendTextToSQLEditor', obj, eventdata);
		
	}
	
	
	
	async destroy() {
		await super.destroy();
	}
	
	// --------------------------------------------------------------------------------
	toOwnFormat() {
		let res = super.toOwnFormat();
		
		res.visualwidgets = [];
		
		for (let i=0;i<this.visualwidgets.length;i++) {
			res.visualwidgets.push(Object.assign({},this.visualwidgets[i],{widgetObject:null, widgetObj:this.visualwidgets[i].widgetObject.toOwnFormat() }))
		}
		
		// -----------
		res.staticqueryviews = [];
		
		for (let i=0;i<this.staticqueryviews.length;i++) {
			res.staticqueryviews.push(Object.assign({},this.staticqueryviews[i],{widgetObject:null, widgetObj:this.staticqueryviews[i].widgetObject.toOwnFormat() }))
		}
		
		// -----------
		res.closedwidgets = JSON.parse(JSON.stringify(this.closedwidgets));
		res.scriptObject = this.scriptControl?this.scriptControl.transformscriptclone:this.scriptObject;
		res.scriptname = this.scriptControl?this.scriptControl.transformscript.scriptName:this.scriptObject.scriptName;
		
		res.name = res.scriptname;
		res.objuuid = res.uuid;
		res.objtype = "script";
		// -------------
		
		return res;
	}
	
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
}
