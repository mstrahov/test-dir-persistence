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

export class AppPageScriptControl extends AppPageControl {
	#tablePickerDialog;
	
	constructor (params) {
		super(params);
		this.fileIOHandler = params.fileIOHandler;
		this.#tablePickerDialog = params.tablePickerDialog;
		this.scriptObject = params.transformScript?params.transformScript:TransformScriptInit();
		
		
		this.scriptControl = this.addGridItem( gridItemScript, 
			{	
				templateid:"#gridItemScriptDialog", 
				headertext: "Script", 
				griditemoptions: {w:6,h:5,},
				transformscript: this.scriptObject,
				scriptname: "",
			}
		);
		this.pyeditor = this.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
		this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
		this.selectFileDialog = this.addGridItem( gridItemSelectFileDialog, {templateid:"#gridItemFileDialog", headertext: "File selection", griditemoptions: {w:6,h:5,}, 
			fileIOHandler: this.fileIOHandler });
		
		let that = this; 
		this.fileIOHandler.eventbus.subscribe('ioDirRefreshNeeded',(obj,eventdata)=>{  that.selectFileDialog.refreshData(eventdata); }, this.selectFileDialog.uuid);
		this.selectFileDialog.eventbus.subscribe('importfiletodf',(obj,eventdata)=>{  that.addImportFileStep(eventdata); }, this.scriptControl.uuid);
		
	}
	// --------------------------------------------------------------------------------
	async init() {
			
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
				//this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: targetEnv, cmd: cmdparams.cmd, result: res });
				console.log("error fetching sheets from excel or not an excel");
			}
		} catch (err) {
			console.log("Excel import run err ",err);
			//this.eventbus.dispatch('CmdExecutionFailed', this, { targetEnv: targetEnv, cmd: cmdparams.cmd, result: null, error: err });
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
			try {
				selectedOption = await this.#tablePickerDialog.showoptions(tabulatoroptions);
				console.log('Selected option:', selectedOption);
			} catch (error) {
				console.error('Error:', error.message);
			}
			// ------------------
			if (selectedOption) {
				// that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:cell.getRow().getIndex(), colnum:colIndex-1}}  );
				// window.teststeps.addScriptStep(eventdata);
				this.scriptControl.addScriptStep({actionid:'ImportExcelFileToDF', parameters:{df:"df",filepath:eventdata.fullpath, sheetname:selectedOption.sheetname}});
				
			}
			
		}
		
		
	}
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
}
