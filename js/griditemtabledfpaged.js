/**********
 * griditemTableDFPaged
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */


import { GridItemWithMenu } from "./griditemwithmenu.js";

export class griditemTableDFPaged extends GridItemWithMenu {
	#internalContainer;
	
	constructor (params) {
		super(params);
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.coderunner = params.coderunner;
		this.parentuuid = params.parentuuid;
		
		this.awaitingrefresh = false;
		
		this.pyodidePromise = this.coderunner.getpyodidePromise();
		this.dfname = params.dfname || 'df';
		this.tabulatorProperties = params.tabulatorProperties || {};
		this.headerContextMenuGeneratorFunction = undefined; 
		this.cellContextMenuGeneratorFunction = undefined; 
		this.#internalContainer = this.bodyelement;
		this.pyodide = undefined;
		this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		// TODO: automatically adjust number of records to output based on df's length ??  	
		this.tabulatorobj = undefined;
		this.columnsarray = [];
		this.columnstypes = undefined;
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
		
		this.pyodide = await this.pyodidePromise;
		
	}
	
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//~ console.log("griditemTableDFPaged widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction") {
			this.showdf();
		} else if (eventdata?.menuItemId === "refreshgriditem") {
			this.showdf();
		} else if (eventdata?.menuItemId === "choosedataframegriditem") {
			this.eventbus.dispatch('requestDataFrameChange', this, { dfname: this.dfname });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		}
		
		// 
	}
	
	// -------------------------------------------------------------------------
	async showdf() {
		if (!this.pyodide) { await this.init(); }
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				await this.destroytabulatorobj();
				//this.tabulatorobj.destroy();
			}
		} catch (err) { console.error(err); }
		//  get data from a df
		let dfarray = {};
		const get_df_data_command =  this.dfname + ".head(1).to_json(orient='split',date_format='iso')";
		try {
			const dfnameexists = await this.coderunner.nameSpaceVarExists(this.parentuuid, this.dfname);
			if (!dfnameexists) {
				console.warn(`${this.dfname} is not defined.`);
				return false;
			}
			const output = await this.coderunner.runPythonAsyncDirect(get_df_data_command, this.parentuuid);
			dfarray = JSON.parse(output);
		} catch (err) {
			console.error(`Error getting ${this.dfname} data or ${this.dfname} is not defined.`,this.getdfcmd,err);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'py', cmd: get_df_data_command, 
						result: this.coderunner.extractPyError(err), msg: `Error getting ${this.dfname} data or ${this.dfname} is not defined (run script?).`, });
			// TODO: show error in place of a table?
			return false;
		}
		//  get type definitions from a df
		try {
			const outputtypes = await this.coderunner.runPythonAsyncDirect(this.gettypescmd, this.parentuuid);
			this.columnstypes = JSON.parse(outputtypes);
			//console.log("df types: ", this.columnstypes); 
			/*
			 * this.columnstypes.data[]   - float64, object,...
			 * this.columnstypes.index[]   -  column names
			 */
		} catch (err) {
			console.error(`Error getting ${this.dfname} data types`,this.gettypescmd,err);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'py', cmd: this.gettypescmd, 
						result: this.coderunner.extractPyError(err), msg: `Error getting ${this.dfname} data types`, });
			// TODO: show error in place of a table?
			return false;
		}
		// window.exectimer.timeit("Showing dataframe 2 / got data...");
		// -------------------   tabulator with regular columns
		this.tabulatorobj = new Tabulator(this.#internalContainer, {
						...this.tabulatorProperties,
						
						index: "df_row_index",
						columns: this.generateColumnDefinitions(dfarray),
					
						data: "",    // this has to set to "" in order for ajaxRequestFunc to work
						// --------------------------------------
						pagination:true,
						paginationMode:"remote",
						paginationCounter:"rows",
						paginationSize:50,
						ajaxURL:"x",
						ajaxRequestFunc: this.internalDataFeed.bind(this),
						// --------------------------------------
						columnDefaults:{
							tooltip:function(e, cell, onRendered){
								var el = document.createElement("div");
								el.innerText = cell.getValue(); 
								return el; 
							},
						}	
					});
		
		
		this.columnsarray = [...dfarray.columns];
		this.tabulatorobj.on("tableBuilt", this.eventTableBuilt.bind(this));

	}
	// -------------------------------------------------------------------------
	
	async changeDataFrame(dfname) {
		this.dfname = dfname;
		this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		await this.showdf();
	}
	
	// -------------------------------------------------------------------------
	eventTableBuilt() {

		this.eventbus.dispatch('tableBuilt', this, {});	
		//window.exectimer.timeit("Showing dataframe 2 / done...");
	}
	// -------------------------------------------------------------------------
	generateColumnDefinitions(dfarray) {
	
		let res = [];
		let colwidth = 25;
		
		colwidth = 25;
		if (this.lastcolumnlayout) {
			let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="df_row_index");
			if (oldlayout) {
				colwidth = oldlayout?.width;
			}
		}
		res.push({
				title: "",
				field: "df_row_index",
				width: colwidth,
				hozAlign: "left",
				sorter: "string",
				formatter: "plaintext",
				frozen:false, 
		});
				
		// columns with data from df
		for (let i=0;i<dfarray.columns.length;i++) {
			let oldlayout = undefined; 
			if (this.lastcolumnlayout) {
				oldlayout = this.lastcolumnlayout.find((e)=>e.title===dfarray.columns[i]);
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
				title: dfarray.columns[i],
				field: `col${i}`,
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
	generateTableData(dfarray) {
		let res = [];
		for (let j=0;j<dfarray.data.length;j++) {
			let newrow = { "df_row_index": dfarray.index[j] };
			for (let i=0;i<dfarray.columns.length;i++) {
				newrow[`col${i}`]=dfarray.data[j][i];	
			}
			res.push(newrow);
		}
		return res;
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
		
		// rows_10_to_15 = df.iloc[9:16].to_json(orient='split')
		// rows_6_to_7 = df.iloc[5:6].to_json(orient='split')
		//  number of columns   df.shape[0]
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
				//~ this.tabulatorobj.destroy();
			//~ } catch (err) { console.error(err); }
		//~ }
		await this.destroytabulatorobj();
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
		
		res.dfname = this.dfname;
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
