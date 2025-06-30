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
		this.sqlcommand = null;
		
		this.displaymode = 0;  
		this._PLAINTABLE = 0;
		this._PROGRESSIVELOAD = 1;
		this._PAGINATED = 2;
		this._DATATREE = 3;
		
		this.headerContextMenuGeneratorFunction = undefined; 
		this.cellContextMenuGeneratorFunction = undefined; 
		this.#internalContainer = this.bodyelement;
		
		//~ this.pyodide = undefined;
		//~ this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		//~ this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		// TODO: automatically adjust number of records to output based on df's length ??  	
		
		
		this.tabulatorobj = undefined;
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
		
		
	}
	
	// -------------------------------------------------------------------------
	
	async init() {
		
		//~ this.pyodide = await this.pyodidePromise;
		
	}
	
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//~ console.log("gridItemQueryView widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction") {
			//~ this.showdf();
		} else if (eventdata?.menuItemId === "refreshgriditem") {
			//~ this.showdf();
		} else if (eventdata?.menuItemId === "choosedataframegriditem") {
			this.eventbus.dispatch('requestDataFrameChange', this, {  });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		}
		
		// 
	}
	// -------------------------------------------------------------------------
	
	async processCodeRunnerResult(obj,eventdata) {
		// { targetEnv: targetEnv, cmd: cmdparams.cmd, result: res }
		if (eventdata.targetEnv!=='sql') {
			return;
		}
		if (eventdata.result?.runStatus) {
			await this.showQueryResult(eventdata.result.output);
		}
	}
	
	
	// -------------------------------------------------------------------------
	async showQueryResult(arrowdata) {
		
		const lengthmilli = this.exectimer.timeit(`Showing query result: starting tabulator output`);
		//this.arrowdata = arrowdata;
		
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				this.tabulatorobj.destroy();
			}
		} catch (err) { console.error(err); }
		
		this.exectimer.timeit(`OLD table deleted`);
		
		if (this.displaymode===this._PLAINTABLE) {
			this.tabulatorProperties = {
					...this.tabulatorProperties,
					data: this.generateTableData(arrowdata),   
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
		}
		
		this.exectimer.timeit(`NEW DATA for table generated`);
		
		// -------------------   tabulator with regular columns
		this.tabulatorobj = new Tabulator(this.#internalContainer, {
						...this.tabulatorProperties,
						index: "_row_index",
						columns: this.generateColumnDefinitions(arrowdata),
						
						// --------------------------------------
						columnDefaults:{
							tooltip:function(e, cell, onRendered){
								var el = document.createElement("div");
								el.innerText = cell.getValue(); 
								return el; 
							},
						}	
					});
		
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
				formatter: "plaintext",
				frozen:false, 
		});
				
		// ----- arrowdata.schema.fields[0].type.typeId
		for (let i=0;i<arrowdata.numCols;i++) {
			let oldlayout = undefined; 
			if (this.lastcolumnlayout) {
				oldlayout = this.lastcolumnlayout.find((e)=>e.title===arrowdata.schema.fields[i].name);
				if (!oldlayout) {
					// do a second search in case column renamed, assume position is the same
					oldlayout = this.lastcolumnlayout.find((e)=>e.field===`col${i}`);
				}
			}
			let colwidth = 130;
			if (oldlayout) {
				colwidth = oldlayout?.width;
			}
			let newcolumn = {
				title: arrowdata.schema.fields[i].name,
				field: arrowdata.schema.fields[i].name,
				width: colwidth,
				hozAlign: "left",
				sorter: "string",
				formatter: "plaintext",
				frozen:false, 
			};
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
		for (let i=0;i<arrowdata.numRows;i++) {
			let newrow = { "_row_index": i };
			arrowdata.schema.fields.forEach((f)=>{
				newrow[f.name]=''+arrowdata.get(i)[f.name];
			});
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
	
	destroy() {
		if (this.tabulatorobj) {
			try {
				this.tabulatorobj.destroy();
			} catch (err) { console.error(err); }
		}
		super.destroy();
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
		// ------------
		if (this.tabulatorobj) {
			try {
				res.columnlayout = this.tabulatorobj.getColumnLayout();
			} catch (e) { console.warn("Column layout save error",e); }
		}	
		return res;
	}
	
	
	// -------------------------------------------------------------------------
	
}
