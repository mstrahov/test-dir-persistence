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
		this.pyeditor = this.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonScriptControlCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
		this.dfview = this.addGridItem( griditemTableDFPagedTransform, {templateid:"#gridItemDFtransformview", headertext: "DataFrame view", griditemoptions: {w:6,h:5,},
			coderunner: this.coderunner,
			parentuuid: this.uuid
		});
		
		
		this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
		this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, {templateid:"#gridItemFileDialog", headertext: "File selection", griditemoptions: {w:6,h:5,}, 
			fileIOHandler: this.fileIOHandler 
		});
		
		let that = this; 
		this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
		this.selectFileDialog.eventbus.subscribe('importfiletodf',async (obj,eventdata)=>{  
			await that.addImportFileStep(eventdata); 
			await that.runScriptOneStep(eventdata); 
		}, this.scriptControl.uuid);
		
		this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.statusTabOutput.runExecutionUpdate(eventdata);  }, this.statusTabOutput.uuid);
		this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.statusTabOutput.runExecutionFailure(eventdata);  }, this.statusTabOutput.uuid);
		
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
		this.eventbus.subscribe('CmdExecutionSuccess',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		this.eventbus.subscribe('CmdExecutionError',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		this.eventbus.subscribe('CmdExecutionFailed',(obj,eventdata)=>{ that.dfview.showdf();  }, this.dfview.uuid);
		
	}
	// --------------------------------------------------------------------------------
	async init() {
			
	}
	// --------------------------------------------------------------------------------	
	async topDropDownMenuEventHandler(obj,eventdata) {
		//console.log("main drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "renameaction") {
		//	this.grid.compact();
		//} else if (eventdata?.menuItemId === 'savelayout') {
		//	console.log(this.layoutToJSON());
		}
		
	}
	
	// --------------------------------------------------------------------------------	
	
	async renameScript() {
		
		
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
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: scriptsteps[steptorun].targetEnv, cmd: scriptsteps[steptorun].scriptCode, result: res });
			}
		} catch (err) {
			console.error("Command run err ",err);
			scriptsteps[steptorun].lastRunStatus = false;
			scriptsteps[steptorun].lastRunResult = 'failed to run';
			scriptsteps[steptorun].executionTime = 0;
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: scriptsteps[steptorun].targetEnv, cmd: scriptsteps[steptorun].scriptCode, result: null, error: err });
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
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: res.targetEnv, cmd: '', result: res });
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
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: res.targetEnv, cmd: '', result: null, error: err });
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
	numrows = sheet.max_row - sheet.min_row + 1
	numcols = sheet.max_column - sheet.min_column + 1
	sheetinfo.append({"sheetname":sheet.title, "numrows":numrows, "numcols":numcols })
workbook.close()
sheetinfo`;
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
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: targetEnv, cmd: sheetinfocmd, result: res });
				console.log("error fetching sheets from excel or not an excel");
			}
		} catch (err) {
			console.log("Excel import run err ",err);
			this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: targetEnv, cmd: sheetinfocmd, result: null, error: err });
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
