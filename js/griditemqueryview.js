/**********************************
 * gridItemQueryView
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */


import { GridItemWithMenu } from "./griditemwithmenu.js";
import { ExecTimer } from "./exectimer.js"; 

export class gridItemQueryView extends GridItemWithMenu {
	#internalContainer;
	#defer;
	#resolve;
	#reject;
	
	constructor (params) {
		super(params);
		
		this.exectimer = new ExecTimer('QueryView Started...');
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.coderunner = params.coderunner;
		this.parentuuid = params.parentuuid;
		
		this.awaitingrefresh = false;
		
		//~ this.pyodidePromise = this.coderunner.getpyodidePromise();
		//~ this.dfname = params.dfname || 'df';
		this.tabulatorProperties = params.tabulatorProperties || {};
		// this.arrowdata = null;
		this.sqlcommand = params.sqlcommand?params.sqlcommand:'';
		this.preferuserlayout = params.preferuserlayout?params.preferuserlayout:false;
		this.lastheadertext = params.lastheadertext?params.lastheadertext:'';
		
		this.displaymode = 0;  
		this._PLAINTABLE = 0;
		this._PROGRESSIVELOAD = 1;
		this._PAGINATED = 2;
		this._DATATREE = 3;
		this._dataTreeElementColumnName = "_tree_Column";
		
		this.headerContextMenuGeneratorFunction = undefined; 
		this.cellContextMenuGeneratorFunction = undefined; 
		this.#internalContainer = this.bodyelement;
		
		//~ this.pyodide = undefined;
		//~ this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		//~ this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		// TODO: automatically adjust number of records to output based on df's length ??  	
		
		
		this.tabulatorobj = undefined;
		
		this.defaultCellContextMenu = [
			{
				label:"Copy",
				action:function(e, cell){
					(async (text)=> {await navigator.clipboard.writeText(text);})(cell.getValue());
				}
			},
		];
		
		this.usercolumnlayout = params.usercolumnlayout?params.usercolumnlayout:undefined;
		this.addFunctionsToUserLayout();
		this.usercolumnlayouthistory = [];
		
		//~ this.columnsarray = [];
		//~ this.columnstypes = undefined;
		this.lastcolumnlayout = undefined;
		if (params.columnlayout) {
			try {
				this.lastcolumnlayout = JSON.parse(JSON.stringify(params.columnlayout));
			} catch (err) {
				console.warn("Error processing initial column layout",err);
			}
		}
		
		
		this.coderunner.eventbus.subscribe('InteractiveVariableChange',this.refreshOnVariableChange.bind(this), this.uuid);
		
	}
	
	// -------------------------------------------------------------------------
	
	async init() {
		//~ this.pyodide = await this.pyodidePromise;
		await this.refreshData();
		
		
		
	}
	// -------------------------------------------------------------------------
	
	async refreshOnVariableChange(obj, eventdata) {
		// this,{ varname:obj.id, newvalue:obj.value } 
		if (eventdata?.varname && this.sqlcommand.toLowerCase().includes(`getvariable('${eventdata.varname.toLowerCase()}')`)) {
			await this.refreshData();
		}
		
		
	}
	
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//~ console.log("gridItemQueryView widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction" || eventdata?.menuItemId === "refreshgriditem") {
			this.refreshData();
		} else if (eventdata?.menuItemId === "editSQLcommandgriditem") {
			this.eventbus.dispatch('editSQLcommandgriditem', this, { sqlcommand: this.sqlcommand });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		} else if (eventdata?.menuItemId === "editcolumnsgriditem") {
			if (this.tabulatorobj) {
				this.eventbus.dispatch('editcolumnsgriditem', this, { columnlayout: this.getTabulatorColumnLayout(),  } );	
			}	
		} else if (eventdata?.menuItemId === "showusercolumnsgriditem") {
			if (this.tabulatorobj && this.usercolumnlayout) {
				
				this.applyColumnLayout(this.usercolumnlayout);
		
			} else if (this.tabulatorobj && this.usercolumnlayouthistory.length>0) {
		
				this.usercolumnlayout = this.usercolumnlayouthistory.pop();
				this.applyColumnLayout(this.usercolumnlayout);
			
			}
		} else if (eventdata?.menuItemId === "clonethistablegriditem") {
			if (this.tabulatorobj) {
				this.eventbus.dispatch('clonethistablegriditem', this, {  } );	
			}	
		} else if (eventdata?.menuItemId === "clonethistabletotreeviewgriditem") {
			if (this.tabulatorobj) {
				this.eventbus.dispatch('clonethistabletotreeviewgriditem', this, { } );	
			}	
		} else if (eventdata?.menuItemId === "edittablelayoutgriditem") {
			this.eventbus.dispatch('edittablelayoutgriditem', this, { });		
		}
		
		// 
	}
	// -------------------------------------------------------------------------
	
	getTabulatorColumnLayout() {
		let res = [];
		
		if (this.tabulatorobj) {
			
			res = this.tabulatorobj.getColumnLayout();
			const colDefs = this.tabulatorobj.getColumnDefinitions();
			
			
			
			//  for some reason getColumnLayout does not export properties of the column groups, need to copy from this.tabulatorobj.getColumnDefinitions()
			
			function getNestedMergedColumnLayout(colobjdef, colobjres) {
				if (colobjdef.hasOwnProperty('cssClass')) {
					colobjres['cssClass'] = colobjdef['cssClass'];
				}
				if (colobjdef.hasOwnProperty('headerHozAlign')) {
					colobjres['headerHozAlign'] = colobjdef['headerHozAlign'];
				}
				for (let i=0;i<colobjres.columns.length;i++) {
					if (colobjres.columns[i].hasOwnProperty('columns') && colobjdef.columns[i].hasOwnProperty('columns') && colobjres.columns[i].title===colobjdef.columns[i].title) {
						getNestedMergedColumnLayout(colobjdef.columns[i], colobjres.columns[i]);
					}
				}
			} 
			
			
			for (let i=0;i<res.length;i++) {
				if (res[i].hasOwnProperty('columns') && colDefs[i].hasOwnProperty('columns') && res[i].title===colDefs[i].title) {
					getNestedMergedColumnLayout(colDefs[i], res[i]);
				}
			}
			
			
		}
		
		return res;
	}
	
	// -------------------------------------------------------------------------
	
	addFunctionsToUserLayout() {
		if (this.usercolumnlayout) {
			let that = this;
			function getNestedMergedColumnLayout(colobjdef) {
				for (let i=0;i<colobjdef.columns.length;i++) {
					if (colobjdef.columns[i].hasOwnProperty('columns')) {
						getNestedMergedColumnLayout(colobjdef.columns[i]);
					} else {
						colobjdef.columns[i].contextMenu = that.defaultCellContextMenu;
					}
				}
			} 
		
			for (let i=0;i<this.usercolumnlayout.length;i++) {
				if (this.usercolumnlayout[i].hasOwnProperty('columns')) {
					getNestedMergedColumnLayout(this.usercolumnlayout[i]);
				} else {
					this.usercolumnlayout[i].contextMenu = this.defaultCellContextMenu;
				}
			}	
		}
	}
	
	
	// -------------------------------------------------------------------------
	async processCodeRunnerResult(obj,eventdata) {
		// { targetEnv: targetEnv, cmd: cmdparams.cmd, result: res }
		if (eventdata.targetEnv!=='sql') {
			return;
		}
		if (eventdata.result?.runStatus) {
			this.sqlcommand = eventdata?.cmd;
			if (this.usercolumnlayout) {
				this.usercolumnlayouthistory.push(JSON.parse(JSON.stringify(this.usercolumnlayout)));
				this.usercolumnlayout = undefined;
			}
			await this.showQueryResult(eventdata.result.output, true);   // receivednewdata
		}
	}
	// ------------------------------------------------------------------------
	
	async refreshData() {
	
		if (!this.sqlcommand) {
			return false;
		}
		
		const res = await this.coderunner.runSQLAsync(this.sqlcommand);
		if (res?.runStatus) {
			await this.showQueryResult(res.output);
		} else {
			console.error("Query view update error:", res.error);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd: this.sqlcommand, result: res });
			
		}
		
	}
	
	// -------------------------------------------------------------------------
	async showQueryResult(arrowdata, receivednewdata=false) {
		
		const lengthmilli = this.exectimer.timeit(`Showing query result: starting tabulator output`);
		//this.arrowdata = arrowdata;
		
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				//this.tabulatorobj.destroy();
				await this.destroytabulatorobj();
			}
		} catch (err) { console.error(err); }
		
		this.exectimer.timeit(`OLD table deleted`);
		
		
		// ===  common table properties
		
		this.tabulatorProperties = {
			...this.tabulatorProperties,
			rowHeight: 32,
			maxHeight: 1000,
			index: "_row_index",
			//selectableRange:true,
			//selectableRangeRows:true,
			clipboardCopyRowRange:"range",
			// --------------------------------------
			columnDefaults:{
				tooltip:function(e, cell, onRendered){
					var el = document.createElement("div");
					el.innerText = cell.getValue(); 
					return el; 
				},
			}	
		};
		
		// === properties by table type
		
		if (this.displaymode===this._PLAINTABLE) {
			this.tabulatorProperties = {
					...this.tabulatorProperties,
					//~ data: this.generateTableData(arrowdata),   
			};
		} else if (this.displaymode===this._PAGINATED) {
			this.tabulatorProperties = {
					...this.tabulatorProperties,
					// --------------------------------------
					data: "",    // this has to set to "" in order for ajaxRequestFunc to work
					pagination:true,
					paginationMode:"remote",
					paginationCounter:"rows",
					paginationSize:50,
					ajaxURL:"x",
					ajaxRequestFunc: this.internalDataFeed.bind(this),
			};
		} else if (this.displaymode===this._DATATREE) {
			this.tabulatorProperties = {
					...this.tabulatorProperties,
					dataTree:true,
					dataTreeFilter:true,
					dataTreeStartExpanded:false,
					dataTreeChildIndent:27,
					dataTreeElementColumn: this._dataTreeElementColumnName, 
			};
			
		}
		
		// === properties based on data size  (tabulator too slow on bigger datasets)
		
		
		if (arrowdata.numRows<10000) {
			this.tabulatorProperties['clipboard'] = 'copy';
		} 
		
		if (arrowdata.numRows<100000) {
			this.tabulatorProperties['selectableRange'] = true;
		} else {
			this.tabulatorProperties['selectableRange'] = false;
		}
		
		// -------------------   tabulator with regular columns
		
		if (this.preferuserlayout && this.usercolumnlayout && !receivednewdata) {
			this.tabulatorProperties.columns = this.usercolumnlayout;	
		} else {
			this.tabulatorProperties.columns = this.generateColumnDefinitions(arrowdata);	
		}
		
		/*if (this.displaymode===this._PLAINTABLE) {
			
			this.tabulatorobj = new Tabulator(this.#internalContainer, {
							...this.tabulatorProperties,
							//~ rowHeight: 32,
							//~ maxHeight: 1000,
							//~ index: "_row_index",
							//~ //selectableRange:true,
							//~ //selectableRangeRows:true,
							//~ clipboardCopyRowRange:"range",
							 
							//~ columns: this.generateColumnDefinitions(arrowdata),
							
							data: this.generateTableData(arrowdata), 
							// --------------------------------------
							//~ columnDefaults:{
								//~ tooltip:function(e, cell, onRendered){
									//~ var el = document.createElement("div");
									//~ el.innerText = cell.getValue(); 
									//~ return el; 
								//~ },
							//~ }	
						});
		}  else */
		
		if (this.displaymode===this._PAGINATED) { 
			this.tabulatorobj = new Tabulator(this.#internalContainer, {
							...this.tabulatorProperties,
							//~ rowHeight: 32,
							//~ maxHeight: 1000,
							//~ index: "_row_index",
							//~ //selectableRange:true,
							//~ //selectableRangeRows:true,
							//~ clipboardCopyRowRange:"range",
							 
							//~ columns: this.generateColumnDefinitions(arrowdata),
							
							//~ data: this.generateTableData(arrowdata), 
							//~ data: "",    // this has to set to "" in order for ajaxRequestFunc to work
							//~ pagination:true,
							//~ paginationMode:"remote",
							//~ paginationCounter:"rows",
							//~ paginationSize:50,
							//~ ajaxURL:"x",
							//~ ajaxRequestFunc: this.internalDataFeed.bind(this),
							// --------------------------------------
							//~ columnDefaults:{
								//~ tooltip:function(e, cell, onRendered){
									//~ var el = document.createElement("div");
									//~ el.innerText = cell.getValue(); 
									//~ return el; 
								//~ },
							//~ }	
						});
		} else /*if (this.displaymode===this._DATATREE) */ {
			
			this.tabulatorobj = new Tabulator(this.#internalContainer, {
							...this.tabulatorProperties,
							//~ rowHeight: 32,
							//~ maxHeight: 1000,
							//~ index: "_row_index",
							//~ //selectableRange:true,
							//~ //selectableRangeRows:true,
							//~ clipboardCopyRowRange:"range",
							 
							//~ columns: this.generateColumnDefinitions(arrowdata),
							
							data: this.generateTableData(arrowdata), 
							
							//~ dataTree:true,
							//~ dataTreeFilter:true,
							//~ dataTreeStartExpanded:true,
							//~ dataTreeChildIndent:27,
							//~ dataTreeElementColumn:this._dataTreeElementColumnName, 
							// --------------------------------------
							//~ columnDefaults:{
								//~ tooltip:function(e, cell, onRendered){
									//~ var el = document.createElement("div");
									//~ el.innerText = cell.getValue(); 
									//~ return el; 
								//~ },
							//~ }	
						});
		}
		
		this.exectimer.timeit(`NEW DATA for table generated`);
		//~ this.columnsarray = [...dfarray.columns];
		this.tabulatorobj.on("tableBuilt", this.eventTableBuilt.bind(this));



	}
	// -------------------------------------------------------------------------
	
	eventTableBuilt() {
		const lengthmilli = this.exectimer.timeit(`Query result ready, table built`);
		this.eventbus.dispatch('tableBuilt', this, {lengthmilli: lengthmilli, lengthseconds: this.exectimer.millitosec(lengthmilli) });	
	}
	// -------------------------------------------------------------------------
	generateColumnDefinitions(arrowdata) {
		//  get type definitions from arrowdata
		let res = [];
		let colwidth = 25;
		
		colwidth = 25;
		if (this.lastcolumnlayout) {
			let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="_row_index");
			if (oldlayout) {
				colwidth = oldlayout?.width;
			}
		}
		res.push({
				title: "",
				field: "_row_index",
				width: colwidth,
				hozAlign: "left",
				sorter: "number",
				headerSortTristate:true,
				formatter: "plaintext",
				frozen:false, 
		});
				
		// ----- arrowdata.schema.fields[0].type.typeId
		const arrowColTypes = arrowDataTypesToTabulatorCols();
		let fldcount = {};
		for (let i=0;i<arrowdata.numCols;i++) {
			
			if (!arrowdata.schema.fields[i].fldname) {
			// ****  check if field name is repeated, add number at the end to make field names unique
				fldcount[arrowdata.schema.fields[i].name] = (fldcount[arrowdata.schema.fields[i].name] || 0) + 1;
				if (fldcount[arrowdata.schema.fields[i].name]>1) {
					let newfldname = `${arrowdata.schema.fields[i].name}_${fldcount[arrowdata.schema.fields[i].name]}`;
					const newfldname0 = newfldname+'_';
					let newnamecnt = 1;
					while (fldcount[newfldname] && newnamecnt<1000) {
						newfldname = newfldname0 + newnamecnt;
						newnamecnt++;
					}
					fldcount[newfldname] = 1;
					arrowdata.schema.fields[i].fldname = newfldname;
					console.log("Replaced field name: ", arrowdata.schema.fields[i].name, arrowdata.schema.fields[i].fldname);
				} else {
					arrowdata.schema.fields[i].fldname = arrowdata.schema.fields[i].name;
				}
			}
			// ****
			let oldlayout = undefined; 
			if (this.lastcolumnlayout) {
				oldlayout = this.lastcolumnlayout.find((e)=>e.title===arrowdata.schema.fields[i].fldname);
				if (!oldlayout) {
					// do a second search in case column renamed, assume position is the same
					oldlayout = this.lastcolumnlayout.find((e)=>e.field===arrowdata.schema.fields[i].fldname);
				}
			}
			let colwidth = 130;
			if (oldlayout) {
				colwidth = oldlayout?.width;
			}
			let newcolumn = {
				title: arrowdata.schema.fields[i].name,
				field: arrowdata.schema.fields[i].fldname,
				width: colwidth,
				hozAlign: "left",
				sorter: "string",
				headerSortTristate:true,
				formatter: "plaintext",
				frozen:false, 
				contextMenu: this.defaultCellContextMenu,
			};
			
			if (arrowColTypes[arrowdata.schema.fields[i].type.typeId]) {
				// ,formatter:"plaintext",sorter:"number",hozAlign:"right"},
				newcolumn.formatter = arrowColTypes[arrowdata.schema.fields[i].type.typeId].formatter;
				newcolumn.sorter = arrowColTypes[arrowdata.schema.fields[i].type.typeId].sorter;
				newcolumn.hozAlign = arrowColTypes[arrowdata.schema.fields[i].type.typeId].hozAlign;
			}
			
			
			if (this.headerContextMenuGeneratorFunction) {
				newcolumn.headerContextMenu = this.headerContextMenuGeneratorFunction;
			}
			if (this.cellContextMenuGeneratorFunction) {
				newcolumn.contextMenu = this.cellContextMenuGeneratorFunction;
			}
			res.push(newcolumn);
		}
		return res;
	}
	// -------------------------------------------------------------------------
	generateTableData(arrowdata) {
		let resArray = [];
		// **********
		
		if (!arrowdata?.schema?.fields[0]?.fldname) {
			let fldcount = {};
			for (let i=0;i<arrowdata?.numCols;i++) {
				// ****  check if field name is repeated, add number at the end to make field names unique
				fldcount[arrowdata.schema.fields[i].name] = (fldcount[arrowdata.schema.fields[i].name] || 0) + 1;
				if (fldcount[arrowdata.schema.fields[i].name]>1) {
					let newfldname = `${arrowdata.schema.fields[i].name}_${fldcount[arrowdata.schema.fields[i].name]}`;
					const newfldname0 = newfldname+'_';
					let newnamecnt = 1;
					while (fldcount[newfldname] && newnamecnt<1000) {
						newfldname = newfldname0 + newnamecnt;
						newnamecnt++;
					}
					fldcount[newfldname] = 1;
					arrowdata.schema.fields[i].fldname = newfldname;
					console.log("Replaced field name: ", arrowdata.schema.fields[i].name, arrowdata.schema.fields[i].fldname);
				} else {
					arrowdata.schema.fields[i].fldname = arrowdata.schema.fields[i].name;
				}
			}
		}
		
		// **********
		for (let i=0;i<arrowdata.numRows;i++) {
			let newrow = { "_row_index": i };
			// [...arrowdata.get(i)]   --->  [Array(2), Array(2)] 
			const vals = [...arrowdata.get(i)];
			for (let j=0;j<arrowdata.schema.fields.length;j++) {
				newrow[arrowdata.schema.fields[j].fldname] = vals[j][1]; 
			}
			//~ arrowdata.schema.fields.forEach((f)=>{
				
				//~ newrow[f.name]=''+arrowdata.get(i)[f.name];
			//~ });
			resArray.push(newrow);
		}
		// **********
		return resArray;
	}
	// -------------------------------------------------------------------------
	async internalDataFeed(url, config, params) {
			//  params expected as {page: 1, size: 50}
			//  return  last_row value, last_page value
			//~ {
				//~ "last_page":15, //the total number of available pages (this value must be greater than 0)
				//~ "last_row":246, //the total number of rows pages (this value must be greater than 0)
				//~ "data":[ // an array of row data objects
					//~ {id:1, name:"bob", age:"23"}, //example row data object
				//~ ]
			//~ }
		
		//data: this.generateTableData(dfarray),
		//console.log("Internal Data Feed params: ",params);
		//console.log("Internal Data Feed config: ",config);
		let res = {
			"last_page":0,
			"last_row":0,
			"data":[]
		};
		
		const number_of_cols_command = this.dfname + ".shape[0]";
		// --------
		let last_row = 0;
		try {
			last_row = await this.coderunner.runPythonAsyncDirect(number_of_cols_command,this.parentuuid);
		} catch (err) {
			console.error(`Error getting ${this.dfname} rows number`,number_of_cols_command,err);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'py', cmd: number_of_cols_command, result: this.coderunner.extractPyError(err), msg: `Error getting ${this.dfname} rows number`, });
			// TODO: show error in place of a table?
			return false;
		}
		
		// ------------- 
		const rowstart = (params.page-1)*params.size;
		const rowend = rowstart + params.size;
		const get_data_command = this.dfname + `.iloc[${rowstart}:${rowend}].to_json(orient='split',date_format='iso')`;
		let dfarray = {};
		try {
			let output = await this.coderunner.runPythonAsyncDirect(get_data_command,this.parentuuid);
			dfarray = JSON.parse(output);
		} catch (err) {
			console.error(`Error getting ${this.dfname} data`,get_data_command,err);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'py', cmd: get_data_command, result: this.coderunner.extractPyError(err), msg: `Error getting ${this.dfname} data`, });
			// TODO: show error in place of a table?
			return false;
		}
		// -------------
		res.last_row = last_row;
		res.last_page = Math.ceil(last_row/params.size); 
		res.data = this.generateTableData(dfarray);
		
		
		return new Promise(function(resolve, reject){
			//do some async data retrieval then pass the array of row data back into Tabulator
			//~ console.log("Promise function called");
			resolve(res);
			//if there is an error call this function and pass the error message or object into it
			//reject();
		});
	}
	// -------------------------------------------------------------------------
	
	async destroytabulatorobj() {		
		let that = this;
		return new Promise((resolve, reject) => {
			if (this.tabulatorobj) {
				try {
					that.tabulatorobj.on("tableDestroyed", ()=>{
						that.tabulatorobj = null;
						resolve();
					});
					that.tabulatorobj.clearData();
					that.tabulatorobj.setData([]).then(()=>{ that.tabulatorobj.destroy();});
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
		//~ if (this.tabulatorobj) {
			//~ try {
				//~ this.tabulatorobj.on("tableDestroyed", this.ontabulatordestroy.bind(this));
				//~ this.tabulatorobj.clearData();
				//~ this.tabulatorobj.setData([]);
				//~ this.tabulatorobj.destroy();
				//~ this.tabulatorobj = null;
				
			//~ } catch (err) { console.error(err); }
		//~ } 
		await this.destroytabulatorobj();
		this.coderunner.eventbus.unsubscribeUUID(this.uuid); 
		await super.destroy();
		
	}
	
	
	// -------------------------------------------------------------------------
	
	//~ ontabulatordestroy() {
		//~ this.coderunner.eventbus.unsubscribeUUID(this.uuid); 
		//~ super.destroy();
	//~ }
	// ------------------------------------
	
	async applyColumnLayout(newColumnLayout) {
		console.log("Received new col layout ", newColumnLayout);
		
		if (!this.tabulatorobj) {
			return false;
		}
		
		this.usercolumnlayout = newColumnLayout;
		this.addFunctionsToUserLayout();
		//~ if (this.tabulatorobj) {
			//~ try {
				//~ //res.tabulatorProperties = JSON.parse(JSON.stringify(this.tabulatorProperties));
				//~ //let oldcolumnlayout = this.tabulatorobj.getColumnLayout();
				//~ this.tabulatorobj.setColumnLayout(newColumnLayout);
			//~ } catch (e) { console.warn("Column layout apply error",e); }
		//~ }	
		
		
		//  need to rebuild the table??
		const lengthmilli = this.exectimer.timeit(`Updating column definitions`);

		let currentData = this.tabulatorobj.getData();
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				//~ this.tabulatorobj.clearData();
				//~ this.tabulatorobj.setData([]);
				//~ this.tabulatorobj.destroy();
				await this.destroytabulatorobj();
			}
		} catch (err) { console.error(err); }
		
		//~ if (this.displaymode===this._PLAINTABLE) {
			//~ this.tabulatorProperties = {
					//~ ...this.tabulatorProperties,
					//~ data: currentData,   
			//~ };
		//~ } else if (this.displaymode===this._PAGINATED) {
			//~ this.tabulatorProperties = {
					//~ ...this.tabulatorProperties,
					//~ // --------------------------------------
					//~ data: "",    // this has to set to "" in order for ajaxRequestFunc to work
					//~ pagination:true,
					//~ paginationMode:"remote",
					//~ paginationCounter:"rows",
					//~ paginationSize:50,
					//~ ajaxURL:"x",
					//~ ajaxRequestFunc: this.internalDataFeed.bind(this),
			//~ };
		//~ }
		
		this.tabulatorProperties = {
				...this.tabulatorProperties,
				columns: newColumnLayout,   
			};
			
		//~ if (currentData.length<10000) {
			//~ this.tabulatorProperties['clipboard'] = 'copy';
		//~ } 
		
		if (this.displaymode===this._PAGINATED) {
			this.tabulatorobj = new Tabulator(this.#internalContainer, {
				...this.tabulatorProperties,
				//~ data: currentData,
				//~ index: "_row_index",
				//~ selectableRange:true,
				//~ //selectableRangeRows:true,
				//~ clipboardCopyRowRange:"range",
				
				//~ columns: newColumnLayout,
				
				// --------------------------------------
				//~ columnDefaults:{
					//~ tooltip:function(e, cell, onRendered){
						//~ var el = document.createElement("div");
						//~ el.innerText = cell.getValue(); 
						//~ return el; 
					//~ },
				//~ }	
			}); 
		} else {
			// -------------------   tabulator with regular columns
			this.tabulatorobj = new Tabulator(this.#internalContainer, {
				...this.tabulatorProperties,
				data: currentData,
				//~ index: "_row_index",
				//~ selectableRange:true,
				//~ //selectableRangeRows:true,
				//~ clipboardCopyRowRange:"range",
				
				//~ columns: newColumnLayout,
				
				// --------------------------------------
				//~ columnDefaults:{
					//~ tooltip:function(e, cell, onRendered){
						//~ var el = document.createElement("div");
						//~ el.innerText = cell.getValue(); 
						//~ return el; 
					//~ },
				//~ }	
			});
						
		}
		
		//~ this.columnsarray = [...dfarray.columns];
		this.tabulatorobj.on("tableBuilt", this.eventTableBuilt.bind(this));
		
		
	}
	
	// ------------------------------------
	toOwnFormat() {
		let res = super.toOwnFormat();
		// -----------
		//~ if (this.lastcolumnlayout) {
			//~ let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="df_row_index");
			//~ if (oldlayout) {
				//~ colwidth = oldlayout?.width;
			//~ }
		//~ }
		
		//~ res.dfname = this.dfname;
		res.parentuuid = this.parentuuid;
		res.sqlcommand = this.sqlcommand;
		res.preferuserlayout = this.preferuserlayout;
		// ------------
		if (this.tabulatorobj) {
			try {
				//res.tabulatorProperties = JSON.parse(JSON.stringify(this.tabulatorProperties));
				res.columnlayout = this.tabulatorobj.getColumnLayout();
				if (this.usercolumnlayout) {
					res.usercolumnlayout = JSON.parse(JSON.stringify(this.usercolumnlayout));
				}
			} catch (e) { console.warn("Column layout save error",e); }
		}	
		return res;
	}
	
	
	// -------------------------------------------------------------------------
	
}

export function arrowDataTypesToTabulatorCols() {
	let res = {};
	res[0]= {typeName:"NONE", typeId:0,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[1]= {typeName:"Null", typeId:1,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[2]= {typeName:"Int", typeId:2,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[3]= {typeName:"Float", typeId:3,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[4]= {typeName:"Binary", typeId:4,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[5]= {typeName:"Utf8", typeId:5,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[6]= {typeName:"Bool", typeId:6,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[7]= {typeName:"Decimal", typeId:7,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[8]= {typeName:"Date", typeId:8,formatter:"plaintext",sorter:"date",hozAlign:"left"};
	res[9]= {typeName:"Time", typeId:9,formatter:"plaintext",sorter:"time",hozAlign:"left"};
	res[10]= {typeName:"Timestamp", typeId:10,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[11]= {typeName:"Interval", typeId:11,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[12]= {typeName:"List", typeId:12,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[13]= {typeName:"Struct", typeId:13,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[14]= {typeName:"Union", typeId:14,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[15]= {typeName:"FixedSizeBinary", typeId:15,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[16]= {typeName:"FixedSizeList", typeId:16,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[17]= {typeName:"Map", typeId:17,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[18]= {typeName:"Duration", typeId:18,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[19]= {typeName:"LargeBinary", typeId:19,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[20]= {typeName:"LargeUtf8", typeId:20,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-1]= {typeName:"Dictionary", typeId:-1,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-2]= {typeName:"Int8", typeId:-2,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-3]= {typeName:"Int16", typeId:-3,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-4]= {typeName:"Int32", typeId:-4,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-5]= {typeName:"Int64", typeId:-5,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-6]= {typeName:"Uint8", typeId:-6,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-7]= {typeName:"Uint16", typeId:-7,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-8]= {typeName:"Uint32", typeId:-8,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-9]= {typeName:"Uint64", typeId:-9,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-10]= {typeName:"Float16", typeId:-10,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-11]= {typeName:"Float32", typeId:-11,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-12]= {typeName:"Float64", typeId:-12,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-13]= {typeName:"DateDay", typeId:-13,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-14]= {typeName:"DateMillisecond", typeId:-14,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-15]= {typeName:"TimestampSecond", typeId:-15,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-16]= {typeName:"TimestampMillisecond", typeId:-16,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-17]= {typeName:"TimestampMicrosecond", typeId:-17,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-18]= {typeName:"TimestampNanosecond", typeId:-18,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-19]= {typeName:"TimeSecond", typeId:-19,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-20]= {typeName:"TimeMillisecond", typeId:-20,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-21]= {typeName:"TimeMicrosecond", typeId:-21,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-22]= {typeName:"TimeNanosecond", typeId:-22,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-23]= {typeName:"DenseUnion", typeId:-23,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-24]= {typeName:"SparseUnion", typeId:-24,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-25]= {typeName:"IntervalDayTime", typeId:-25,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-26]= {typeName:"IntervalYearMonth", typeId:-26,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-27]= {typeName:"DurationSecond", typeId:-27,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	res[-28]= {typeName:"DurationMillisecond", typeId:-28,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-29]= {typeName:"DurationMicrosecond", typeId:-29,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-30]= {typeName:"DurationNanosecond", typeId:-30,formatter:"plaintext",sorter:"number",hozAlign:"right"};
	res[-31]= {typeName:"IntervalMonthDayNano", typeId:-31,formatter:"plaintext",sorter:"string",hozAlign:"left"};
	return res;
	
	
}
