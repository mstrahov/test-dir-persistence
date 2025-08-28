/**********
 * gridItemFileDialog
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */
import { GridItemWithMenu } from "./griditemwithmenu.js";
import { FileUploadButton, FileDownLoadDialog } from "./filedialogs.js";

export class gridItemFileDialog extends GridItemWithMenu {
	
	constructor (params) {
		super(params);
		this.fileIOHandler = params.fileIOHandler;
		this.filesaveasdialog = new FileDownLoadDialog({fileSystemHandler: this.fileIOHandler});
		this.tabulatorProperties = undefined;
		this.tabulatorObj = undefined;
		this.awaitingrefresh = false;
		this.lastcolumnlayout = undefined;
		if (params.columnlayout) {
			try {
				this.lastcolumnlayout = JSON.parse(JSON.stringify(params.columnlayout));
			} catch (err) {
				console.warn("Error processing initial column layout",err);
			}
		}
	}
	// --------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//console.log("gridItemFileDialog widget",this.__proto__?.constructor?.name, this.headerText, "item click: ",obj,eventdata); 
		
		if (eventdata?.menuItemId === "mountlocaldirectoryitem") {
			this.fileIOHandler.mountDirectory();
			
		} else if (eventdata?.menuItemId === "refreshgriditem" || eventdata?.menuItemId ===  "refreshaction") {
			this.awaitingrefresh = true;
			this.fileIOHandler.syncFS();
		} else if (eventdata?.menuItemId === "uploadfiletoopfsitem") {
			this.awaitingrefresh = true;
			this.fileuploaddialog.uploadFilesButtonClick();
			
		//~ } else if (eventdata?.menuItemId === "prevcommandmenuitem") {
			//~ this.showPreviousCommand();
		//~ } else if (eventdata?.menuItemId === "nextcommandmenuitem") {
			//~ this.showNextCommand();
		//~ } else if (eventdata?.menuItemId === "runselectedcommandmenuitem") {
			//~ this.runSelectedEditorCode("\n");
		//~ } else if (eventdata?.menuItemId === "runcommandmenuitem") {
			//~ this.runEditorCode("\n");
		//~ } else if (eventdata?.menuItemId === "dumpallhistory") {
			//~ this.showAllHistory();
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });	
		}
		
	}
	// --------------------------------------------------------------------------
	async init() {
		let filetree = await this.fileIOHandler.genFileTreePyFS(this.fileIOHandler.APP_ROOT_DIR);
		let that = this;
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:false,
			reactiveData:false, 
			columns:[
				{title:"Name", field:"name", editor:false, headerSort:true, headerFilter:"input", headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),width:250, },
				{title:"Pick", field:"pick", editor:true,headerSort:false,
					formatter:"tickCross", 
					 hozAlign:"center", 
					formatterParams:{
						allowEmpty:true,
						allowTruthy:true,
					},
					cellEdited:function(cell){
							const row = cell.getRow();
							const rowdata = row.getData();
							if (rowdata.type === 'directory') {
								row.treeToggle();
							}
							console.log(rowdata);
							row.toggleSelect();
							
							row.update({"pick":null}); 
							(async (text)=> {await navigator.clipboard.writeText(text);})(rowdata.fullpath);
							//console.log(cell);
					 },
				},
				{title:"Last change", field:"modificationDate", editor:false, headerFilter:"datetime",  headerFilterFunc:this.customHeaderFilterDate.bind(this), headerSort:true, hozAlign:"left",
					sorter:"datetime",
					formatter:"datetime",
					formatterParams:{
						//inputFormat:"yyyy-MM-dd HH:ss",
						outputFormat:"yyyy-MM-dd TT", //  "D TT", 
						invalidPlaceholder:"",
					},
					width:160,},
				{title:"Size", field:"sizeBytes", hozAlign:"right", editor:false, 
						headerSort:true, sorter:"number",
						headerFilter:this.minMaxFilterEditor.bind(this),
						headerFilterFunc:this.minMaxFilterFunction.bind(this),
						headerFilterLiveFilter:false,},
				{title:"Type", field:"filetype", editor:false, 
						headerSort:true, 
						headerFilter:"input",
						headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),
				},
				
				// 
			],
			data:filetree,
			dataTree:true,
			dataTreeFilter:true,
			dataTreeStartExpanded:false,
			dataTreeChildIndent:27,
			dataTreeElementColumn:"name", 
			selectableRows:1,
			selectableRowsPersistence:false,
			selectableRowsCheck:function(row){
				return row.getData().type==='file'; //allow selection of rows with files only
			},
			rowContextMenu:[
				{
					label:"Copy path to clipboard",
					action:function(e, row){
						//console.log(row.getData());
						(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
					}
				},
				{
					label:"Save file as ...",
					action:function(e, row){
						//console.log(row.getData());
						(async (path)=> {await that.filesaveasdialog.downloadFromFSPath(path); })(row.getData().fullpath);
					}
				},
				{
					label:"Export database to this directory ...",
					action:function(e, row){
						//console.log(row.getData());
						that.eventbus.dispatch('exportdatabasetodir', that, { fullpath: row.getData().fullpath, type: row.getData().type});	  //rowdata.type === 'directory'
					}
				},
				{
					label:"Delete file",
					action:function(e, row){
						//console.log(row.getData());
						that.eventbus.dispatch('deletefilecmd', that, { fullpath: row.getData().fullpath, type: row.getData().type});	  //rowdata.type === 'directory'
					}
				},
			],
			
		};
			
		// ---------------------------- Restore last column widths
		if (this.lastcolumnlayout) {
			for (let i1=0;i1<this.tabulatorProperties.columns.length;i1++) {
				let oldlayout = this.lastcolumnlayout.find((e)=>e.title===this.tabulatorProperties.columns[i1].title);
				if (!oldlayout) {
					// do a second search in case column renamed, assume field name is the same
					oldlayout = this.lastcolumnlayout.find((e)=>e.field===this.tabulatorProperties.columns[i1].field);
				}
				if (oldlayout) {
					this.tabulatorProperties.columns[i1].width = oldlayout?.width;
				}
			}
		}
		// -----------------------------	
				
		this.tabulatorObj = new Tabulator(this.bodyelement, this.tabulatorProperties);
				
		this.tabulatorObj.on("rowDblClick", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		this.tabulatorObj.on("rowDblTap", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		
		
		
		this.fileuploaddialog = new FileUploadButton({containertemplateid: "#hiddenuploadbuttontemplate", containerid:"#fileuploaddialogplaceholder"+this.uuid,  fileSystemHandler: this.fileIOHandler });
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
	}
	// --------------------------------------------------------------------------
	
	async refreshData(eventdata) {
		console.log(eventdata);
		// source: 'syncFS',  source: 'mountDirectory'
		let resetGrid = true;
		let eventSource = '';
		if (eventdata?.source) {
			eventSource = eventdata?.source;
		}
		// do not refresh grid on syncFS unless specifically requested earlier
		// TODO: when no dirs added, should re-open branches of the grid if files not changed?
		if (this.awaitingrefresh) {
			this.awaitingrefresh = false;
		} else {
			if (eventSource==='syncFS') {
				resetGrid = false;
			}
		}
		
		if  (this.tabulatorObj && resetGrid) {
			let filetree = await this.fileIOHandler.genFileTreePyFS(this.fileIOHandler.APP_ROOT_DIR);
			this.tabulatorObj.setData(filetree);
		}
	}
	
	
	// ---------------------------------------------------------------------------
	minMaxFilterEditor(cell, onRendered, success, cancel, editorParams) {
		let end;
		let container = document.createElement("span");
		//create and style inputs
		let start = document.createElement("input");
		start.setAttribute("type", "number");
		start.setAttribute("placeholder", "Min");
		start.setAttribute("min", 0);
		start.setAttribute("max", 100);
		start.style.padding = "4px";
		start.style.width = "50%";
		start.style.boxSizing = "border-box";
		start.value = cell.getValue();
		function buildValues(){
			success({
				start:start.value,
				end:end.value,
			});
		}
		function keypress(e){
			if(e.keyCode == 13){
				buildValues();
			}

			if(e.keyCode == 27){
				cancel();
			}
		}
		end = start.cloneNode();
		end.setAttribute("placeholder", "Max");
		start.addEventListener("change", buildValues);
		start.addEventListener("blur", buildValues);
		start.addEventListener("keydown", keypress);
		end.addEventListener("change", buildValues);
		end.addEventListener("blur", buildValues);
		end.addEventListener("keydown", keypress);
		container.appendChild(start);
		container.appendChild(end);
		return container;
	}
	// --------------------------------------------------------------------------
				//custom max min filter function
	minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
		//headerValue - the value of the header filter element
		//rowValue - the value of the column in this row
		//rowData - the data for the row being filtered
		//filterParams - params object passed to the headerFilterFuncParams property
			if(rowValue){
				if(headerValue.start != ""){
					if(headerValue.end != ""){
						return rowValue >= headerValue.start && rowValue <= headerValue.end;
					}else{
						return rowValue >= headerValue.start;
					}
				}else{
					if(headerValue.end != ""){
						return rowValue <= headerValue.end;
					}
				}
			}
		return true; //must return a boolean, true if it passes the filter.
	}
	// --------------------------------------------------------------------------			
	customHeaderFilterDate(headerValue, rowValue, rowData, filterParams) {
		//headerValue - the value of the header filter element
		//rowValue - the value of the column in this row
		//rowData - the data for the row being filtered
		//filterParams - params object passed to the headerFilterFuncParams property
		// column.setHeaderFilterValue("");
		let filterval = true;
		try {
			if(rowValue){
				filterval = rowValue.toMillis() >= luxon.DateTime.fromISO(headerValue).toMillis();
			} 
		} catch (e) {
			console.error(e);
		}	
		
		return filterval; //must return a boolean, true if it passes the filter.
	}
	// --------------------------------------------------------------------------				
	customHeaderIncludesStringFunction(headerValue, rowValue, rowData, filterParams) {
		//headerValue - the value of the header filter element
		//rowValue - the value of the column in this row
		//rowData - the data for the row being filtered
		//filterParams - params object passed to the headerFilterFuncParams property
		// column.setHeaderFilterValue("");
		let res = true;
		//console.log("header filter",headerValue,rowData);
		if (!headerValue||headerValue.length==0) { return true; } 
		try {
			if (rowData._children) { return true; }
			if(rowValue){
				res = rowValue.includes(headerValue);
				//console.log("header filter res",res,rowValue,rowData);
			} 
		} catch (e) {
			console.error(e);
		}						
		
		return res;
	}	
	// --------------------------------------------------------------------------	
	refresh() {
		//~ this.tabulatorObj?.destroy();
		//~ this.tabulatorObj = null;
		//~ this.tabulatorObj = new Tabulator(this.bodyelement, this.tabulatorProperties);
		
	}
	// -------------------------------------------------------------------------
	async destroytabulatorobj() {		
		let that = this;
		return new Promise((resolve, reject) => {
			if (this.tabulatorObj) {
				try {
					that.tabulatorObj.on("tableDestroyed", ()=>{
						that.tabulatorObj = null;
						resolve();
					});
					that.tabulatorObj.clearData();
					that.tabulatorObj.setData([]).then(()=>{ that.tabulatorObj.destroy();});
				} catch (err) { 
					console.error(err);
					reject(err); 
				}
			} else {
				resolve();
			}
		})
	}
		
	// ---------------------------------------------------------------------------
	async destroy() {
		//~ if (this.tabulatorObj) {
			//~ try {
				//~ this.tabulatorObj.destroy();
			//~ } catch (err) { console.error(err); }
		//~ }
		await this.destroytabulatorobj();
		await super.destroy();
	}
	
	// -------------------------------------------------------------------------
	
	
	
}

// ------------------------

async function showFileSelectionDialog() {
				const filehandler = window.localFileHandler;
				let filetree = await filehandler.genFileTreePyFS('/app');
				console.log(filetree);
				// filetree
				
				var minMaxFilterEditor = function(cell, onRendered, success, cancel, editorParams){
					var end;
					var container = document.createElement("span");
					//create and style inputs
					var start = document.createElement("input");
					start.setAttribute("type", "number");
					start.setAttribute("placeholder", "Min");
					start.setAttribute("min", 0);
					start.setAttribute("max", 100);
					start.style.padding = "4px";
					start.style.width = "50%";
					start.style.boxSizing = "border-box";
					start.value = cell.getValue();
					function buildValues(){
						success({
							start:start.value,
							end:end.value,
						});
					}
					function keypress(e){
						if(e.keyCode == 13){
							buildValues();
						}

						if(e.keyCode == 27){
							cancel();
						}
					}
					end = start.cloneNode();
					end.setAttribute("placeholder", "Max");
					start.addEventListener("change", buildValues);
					start.addEventListener("blur", buildValues);
					start.addEventListener("keydown", keypress);
					end.addEventListener("change", buildValues);
					end.addEventListener("blur", buildValues);
					end.addEventListener("keydown", keypress);
					container.appendChild(start);
					container.appendChild(end);
					return container;
				 }

				//custom max min filter function
				function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams){
					//headerValue - the value of the header filter element
					//rowValue - the value of the column in this row
					//rowData - the data for the row being filtered
					//filterParams - params object passed to the headerFilterFuncParams property
						if(rowValue){
							if(headerValue.start != ""){
								if(headerValue.end != ""){
									return rowValue >= headerValue.start && rowValue <= headerValue.end;
								}else{
									return rowValue >= headerValue.start;
								}
							}else{
								if(headerValue.end != ""){
									return rowValue <= headerValue.end;
								}
							}
						}
					return true; //must return a boolean, true if it passes the filter.
				}
				
				function customHeaderFilterDate(headerValue, rowValue, rowData, filterParams){
					//headerValue - the value of the header filter element
					//rowValue - the value of the column in this row
					//rowData - the data for the row being filtered
					//filterParams - params object passed to the headerFilterFuncParams property
					// column.setHeaderFilterValue("");
					let filterval = true;
					try {
						if(rowValue){
							filterval = rowValue.toMillis() >= luxon.DateTime.fromISO(headerValue).toMillis();
						} 
					} catch (e) {
						console.error(e);
					}	
					
					return filterval; //must return a boolean, true if it passes the filter.
				}
					
				function customHeaderIncludesStringFunction(headerValue, rowValue, rowData, filterParams){
					//headerValue - the value of the header filter element
					//rowValue - the value of the column in this row
					//rowData - the data for the row being filtered
					//filterParams - params object passed to the headerFilterFuncParams property
					// column.setHeaderFilterValue("");
					let res = true;
					//console.log("header filter",headerValue,rowData);
					if (!headerValue||headerValue.length==0) { return true; } 
					try {
						if (rowData._children) { return true; }
						if(rowValue){
							res = rowValue.includes(headerValue);
							//console.log("header filter res",res,rowValue,rowData);
						} 
					} catch (e) {
						console.error(e);
					}						
					
					return res;
				}			
				
				let tabulatorProperties = {
					height:"311px", 
					movableRows:false,
					reactiveData:false, 
					//index: "stepOrder",
					//rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
					columns:[
						//~ {formatter:"rowSelection", titleFormatter:"", hozAlign:"center", headerSort:false, 
							//~ cellClick:function(e, cell){
								//~ const row = cell.getRow();
								//~ console.log(row.getData());
								//~ row.toggleSelect();
								
							 //~ },
							 //~ cellEdited:function(e, cell){
								//~ const row = cell.getRow();
								//~ const rowdata = row.getData();
								//~ if (rowdata.type === 'directory') {
									//~ row.treeToggle();
								//~ }
								//~ console.log(row.getData());
								//~ row.toggleSelect();
							 //~ },
						//~ },
						{title:"Name", field:"name", editor:false, headerSort:true, headerFilter:"input", headerFilterFunc:customHeaderIncludesStringFunction, },
						{title:"Pick", field:"pick", editor:true,headerSort:false,
							formatter:"tickCross", 
							 hozAlign:"center", 
							formatterParams:{
								allowEmpty:true,
								allowTruthy:true,
							},
							cellEdited:function(cell){
									const row = cell.getRow();
									const rowdata = row.getData();
									if (rowdata.type === 'directory') {
										row.treeToggle();
									}
									console.log(rowdata);
									row.toggleSelect();
									
									row.update({"pick":null}); 
									(async (text)=> {await navigator.clipboard.writeText(text);})(rowdata.fullpath);
									//console.log(cell);
							 },
						},
						{title:"Last change", field:"modificationDate", editor:false, headerFilter:"datetime",  headerFilterFunc:customHeaderFilterDate, headerSort:true, hozAlign:"left",
							sorter:"datetime",
							formatter:"datetime",
							formatterParams:{
								//inputFormat:"yyyy-MM-dd HH:ss",
								outputFormat:"yyyy-MM-dd TT", //  "D TT", 
								invalidPlaceholder:"",
							},
							width:160,},
						{title:"Size", field:"sizeBytes", hozAlign:"right", editor:false, headerSort:true,sorter:"number",headerFilter:minMaxFilterEditor,headerFilterFunc:minMaxFilterFunction,headerFilterLiveFilter:false,},
						{title:"Type", field:"filetype", editor:false, headerSort:true,headerFilter:"input",headerFilterFunc:customHeaderIncludesStringFunction,},
						
						// 
					],
					data:filetree,
					dataTree:true,
					dataTreeFilter:true,
					dataTreeStartExpanded:false,
					dataTreeChildIndent:27,
					dataTreeElementColumn:"name", 
					selectableRows:1,
					selectableRowsPersistence:false,
					selectableRowsCheck:function(row){
						return row.getData().type==='file'; //allow selection of rows with files only
					},
					rowContextMenu:[
						{
							label:"Select",
							action:function(e, row){
								console.log(row.getData());
								(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
							}
						},
						{
							label:"Save file as ...",
							action:function(e, row){
								console.log(row.getData());
								(async (path)=> {await filesaveasdialog.downloadFromFSPath(path); })(row.getData().fullpath);
							}
						},
						
					],
					
				};
				
			
				window.testfilelisttable?.destroy();
				window.testfilelisttable = null;
				window.testfilelisttable = new Tabulator("#filetree", tabulatorProperties);
				window.testfilelisttable.on("rowDblClick", function(e, row){
					//e - the click event object
					//row - row component
					console.log(row.getData()); 
					(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
				});
				window.testfilelisttable.on("rowDblTap", function(e, row){
					//e - the click event object
					//row - row component
					console.log(row.getData()); 
					(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
				});
				
			}
