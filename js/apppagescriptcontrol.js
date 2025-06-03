/*******************
 * AppPageScriptControl - 
 * 
 * 
 * Requirements:  bootstrap5, gridstack.js
 * 
 * ****************************/

import { AppPageControl } from "./apppagecontrol.js";
import { GridItemPyEditor } from  "./griditempyeditor.js";
//import { GridItemSQLEditor } from  "./griditemsqleditor.js";
import { StatusGridItemTextOutput } from "./griditemtextoutput.js";
import { gridItemScript, TransformScriptInit } from "./griditemscript.js";
import { gridItemSelectFileDialog } from "./griditemselectfiledialog.js";
// import { griditemTableDFPaged } from "./griditemtabledfpaged.js";
import { griditemTableDFPagedTransform } from "./griditemtabledfpagedtransform.js";
import { GridItemHTMLOutput } from "./griditemhtmloutput.js";

export class AppPageScriptControl extends AppPageControl {
	#tablePickerDialog;
	#modalInputDialog;
	
	constructor (params) {
		super(params);
		this.fileIOHandler = params.fileIOHandler;
		this.#tablePickerDialog = params.tablePickerDialog;
		this.scriptObject = params.transformScript?params.transformScript:TransformScriptInit();
		this.#modalInputDialog = params.modalInputDialog;
		
		
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.topDropDownMenuEventHandler.bind(this));
		
		this.scriptControl = this.addGridItem( gridItemScript, 
			{	
				templateid:"#gridItemScriptDialog", 
				headertext: "Script", 
				griditemoptions: {w:6,h:5,},
				transformscript: this.scriptObject,
				scriptname: "",
			}
		);
		this.setTabTitle(this.scriptControl.transformscript.scriptName);
		
		
		this.pyeditor = this.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonScriptControlCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
		this.dfview = this.addGridItem( griditemTableDFPagedTransform, {templateid:"#gridItemDFtransformview", headertext: "DataFrame edit view", griditemoptions: {w:6,h:5,},
			coderunner: this.coderunner,
			parentuuid: this.uuid
		});
		
		
		this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
		
		this.visualwidgets = [];
		let that = this; 
		
		// ---------------   gridItemSelectFileDialog ---------------------
		this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, {templateid:"#gridItemFileDialog", headertext: "File selection", griditemoptions: {w:6,h:5,}, 
			fileIOHandler: this.fileIOHandler 
		});
				
		this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
		this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
			await that.addImportFileStep(eventdata); 
			await that.runScriptOneStep(eventdata); 
		}, this.scriptControl.uuid);
		
		// ----------------------------------------------------------------

		// ----------------------------------------------------------------
		
		this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.statusTabOutput.runExecutionFailure(eventdata);  }, this.statusTabOutput.uuid);
		this.eventbus.subscribe('getVariableError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		
		this.scriptControl.eventbus.subscribe('runonecodestepaction',(obj,eventdata)=>{  that.runScriptOneStep(eventdata); }, this.uuid);
		this.scriptControl.eventbus.subscribe('runallcodestepsaction',(obj,eventdata)=>{  that.runScriptAllSteps(eventdata); }, this.uuid);
		
		this.scriptControl.eventbus.subscribe('showscriptaspythoneditable',(obj,eventdata)=>{  that.pyeditor.setValue(eventdata?.pycode); }, this.uuid);
		
		this.scriptControl.eventbus.subscribe('loadfrompythonscript',(obj,eventdata)=>{  that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue()); }, this.uuid);
		
		this.pyeditor.eventbus.subscribe('runeditorcode',(obj,eventdata)=>{ that.runCmdFromGridItem('py',obj,eventdata);  }, this.uuid);
		this.pyeditor.eventbus.subscribe('clickableactionclick',(obj,eventdata)=>{ 
			if (eventdata?.menuItemId === "syncaction") {
				that.scriptControl.loadScriptFromPyCode(that.pyeditor.getValue());  
			}
		}, this.uuid);
		
		this.dfview.eventbus.subscribe('cmdActionEvent',async (obj,eventdata)=>{  
			await that.scriptControl.addScriptStep(eventdata);
			await that.runScriptOneStep(eventdata); 
		}, this.scriptControl.uuid);
		
		this.dfview.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		this.dfview.eventbus.subscribe('requestDataFrameChange',this.dfViewDataFrameChange.bind(this), this.uuid);
		
		
		this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		
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
			this.destroyGridItem(this.visualwidgets[widgetIndex].widgetObject);
			delete this.visualwidgets[widgetIndex].widgetObject;
			this.visualwidgets.splice(widgetIndex, 1);
			
		} else {
			console.error("Widget to delete not found!");
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
			console.log(this.scriptControl.transformscript);
		}
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
	setTabTitle(newTitle) {
		let str1 = newTitle;
		if (str1.length>14) {
			str1 = str1.slice(0,11)+'...';
		}
		this.contenttab.setTitle(str1);
		this.contenttab.setTitleToolTip(newTitle);
		
	}
	
	// --------------------------------------------------------------------------------
	async renameScript() {
		try {
			const props = {
				dialogTitle: "Script name:",
				inputOneLine: this.scriptControl.transformscript.scriptName,
				inputOneLinePlaceHolder: "Script name",
			};
			const selectedOption = await this.#modalInputDialog.showdialog(props);
			console.log('Return value:', selectedOption.inputOneLine);
			this.scriptControl.transformscript.scriptName = selectedOption.inputOneLine.trim();
			this.setTabTitle(selectedOption.inputOneLine.trim());
			
		} catch (error) {
			console.error('Error:', error.message);
		}

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
			console.log("Command run res: ", res);
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
			let scriptsteps = this.scriptControl?.transformscript?.transformSteps;
		
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
			console.log("Command run res: ", res);
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
			
		} else if (eventdata?.filetype?.toLowerCase() === 'csv') {
			
			
		} 
		
		
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
				await this.scriptControl.addScriptStep({actionid:'ImportExcelFileToDF', parameters:{df:"df",filepath:eventdata.fullpath, sheetname:selectedOption.sheetname}});
				
			}
			
		}
		
		
	}
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
}
