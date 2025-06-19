/**********
 * gridItemOwnFormat
 * depends: Tabulator.js
 * 
 * own format browser
 * 
 ***********************************   */
import { GridItemWithMenu } from "./griditemwithmenu.js";

export class gridItemOwnFormat extends GridItemWithMenu {
	
	constructor (params) {
		super(params);
		this.OwnFormatHandler = params.OwnFormatHandler;
		
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
		console.log("gridItemOwnFormat widget",this.__proto__?.constructor?.name, this.headerText, "item click: ",obj,eventdata); 
		
		if (eventdata?.menuItemId === "____mountlocaldirectoryitem") {
			
			
		} else if (eventdata?.menuItemId === "refreshgriditem" || eventdata?.menuItemId ===  "refreshaction") {
			this.awaitingrefresh = true;
			this.refreshData();
		} else if (eventdata?.menuItemId === "_____uploadfiletoopfsitem") {
			//~ this.awaitingrefresh = true;
			
			
		}
		
	}
	// --------------------------------------------------------------------------
	async init() {
		let datatree = await this.OwnFormatHandler.generateTabulatorTree();
		let that = this;
		
			//~ name: 'Scripts',
			//~ isopen: null,
			//~ autorun: null,
			//~ objtype: '', 
			//~ objuuid:  '', 
			//~ lastRunResult: '', 
			//~ lastRunStatus: null, 
			//~ _children: scripttree,
			//~ _level: 0,
		
		
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:false,
			reactiveData:false, 
			columns:[
				{title:"Object Name", field:"name", editor:false, headerSort:true, 
					headerFilter:"input", 
					headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),
					width:250, 
				},
				{title:"Auto Open", field:"isopen", editor:true,headerSort:true,
					formatter:"tickCross", 
					 hozAlign:"center", 
					 width: 80, 
					formatterParams:{
						allowEmpty:true,
						allowTruthy:true,
					},
				},
				{title:"Auto Run", field:"autorun", editor:true,headerSort:true,
					formatter:"tickCross", 
					 hozAlign:"center", 
					width: 80, 
					formatterParams:{
						allowEmpty:true,
						allowTruthy:true,
					},
				},
				{title:"Last Run Status", field:"lastRunStatus", editor:false, headerSort:true,
					formatter:"tickCross", 
					 hozAlign:"center", 
					 width: 80, 
					formatterParams:{
						allowEmpty:true,
						allowTruthy:true,
					},
				},
				{title:"Last Run Result", field:"lastRunResult", editor:false, 
						headerSort:true, 
						headerFilter:"input",
						headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),
				},
				
				// 
			],
			data:datatree,
			dataTree:true,
			dataTreeFilter:true,
			dataTreeStartExpanded:true,
			dataTreeChildIndent:27,
			dataTreeElementColumn:"name", 
			//~ selectableRows:1,
			//~ selectableRowsPersistence:false,
			//~ selectableRowsCheck:function(row){
				//~ return row.getData().type==='file'; //allow selection of rows with files only
			//~ },
			rowContextMenu:[
				{
					label:"Open script",
					action:function(e, row){
						console.log(row.getData());
						//~ (async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
					}
				},
				{
					label:"Run script",
					action:function(e, row){
						console.log(row.getData());
						//~ (async (path)=> {await that.filesaveasdialog.downloadFromFSPath(path); })(row.getData().fullpath);
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
			//~ (async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		this.tabulatorObj.on("rowDblTap", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			//~ (async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		
				
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
			let datatree = await this.OwnFormatHandler.generateTabulatorTree();
			this.tabulatorObj.setData(datatree);
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
	// --------------------------------------------------------------------------
	
	toOwnFormat() {
		let res = super.toOwnFormat();
		// -----------
		//~ if (this.lastcolumnlayout) {
			//~ let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="df_row_index");
			//~ if (oldlayout) {
				//~ colwidth = oldlayout?.width;
			//~ }
		//~ }
		
		// ------------
		try {
			res.columnlayout = this.tabulatorObj.getColumnLayout();
		} catch (e) {  console.warn("Column layout save error",e);  }
				
		return res;
	}
	
	
}
