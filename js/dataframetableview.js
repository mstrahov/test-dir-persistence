/********************************
 *  requires Tabulator.js
 * 		outputs contents of a given dataframe to tabulator table
 * 
 * *******************************/

import EventBus from "./eventbus.js";


export class DataFrameTableView {
	#containerid;
	#internalContainer;
	#uuid;
	
	constructor(params) {
		this.#containerid = params.containerid;	
		this.pyodidePromise = params.pyodidePromise;
		this.dfname = params.dfname || 'df';
		this.tabulatorProperties = params.tabulatorProperties || {};
		this.headerContextMenuGeneratorFunction = undefined; 
		this.cellContextMenuGeneratorFunction = undefined; 
		
		this.#uuid = self.crypto.randomUUID();
		this.#internalContainer = document.querySelector(this.#containerid);
		this.pyodide = undefined;
		this.eventbus = new EventBus(this);
		this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		// TODO: automatically adjust number of records to output based on df's length ??  	
		this.tabulatorobj = undefined;
		this.columnsarray = [];
		this.columnstypes = undefined;
		this.lastcolumnlayout = undefined;
	}
	
	async init() {
		//this.eventbus = new EventBus(this);
		this.pyodide = await this.pyodidePromise;
		
	}
	
	async showdf() {
		if (!this.pyodide) { await this.init(); }
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				this.tabulatorobj.destroy();
			}
		} catch (err) { console.error(err); }
		//  get data from a df
		let dfarray = {};
		try {
			const get_df_data_command =  this.dfname + ".head(1).to_json(orient='split',date_format='iso')";
			const output = await this.pyodide.runPythonAsync(get_df_data_command);
			dfarray = JSON.parse(output);
		} catch (err) {
			console.error(`Error getting ${this.dfname} data`,this.getdfcmd,err);
			// TODO: show error in place of a table?
			return false;
		}
		//  get type definitions from a df
		try {
			const outputtypes = await this.pyodide.runPythonAsync(this.gettypescmd);
			this.columnstypes = JSON.parse(outputtypes);
			//console.log("df types: ", this.columnstypes); 
			/*
			 * this.columnstypes.data[]   - float64, object,...
			 * this.columnstypes.index[]   -  column names
			 */
		} catch (err) {
			console.error(`Error getting ${this.dfname} data types`,this.gettypescmd,err);
			// TODO: show error in place of a table?
			return false;
		}
		window.exectimer.timeit("Showing dataframe 2 / got data...");
		//~ this.tabulatorobj = new Tabulator(this.#internalContainer, {
						//~ ...this.tabulatorProperties,
						//~ spreadsheet:true,  
						//~ rowHeader:{field:"_id", hozAlign:"center", headerSort:false, frozen:true},  
						//~ //height:"311px",  
						//~ spreadsheetRows: dfarray.data.length,	
						//~ spreadsheetColumns: dfarray.columns.length,	
						//~ spreadsheetData: dfarray.data,  
						//~ // --------------------------------------
						//~ columnDefaults:{
							//~ tooltip:function(e, cell, onRendered){
								//~ var el = document.createElement("div");
								//~ el.innerText = cell.getValue(); 
								//~ return el; 
							//~ },
						//~ }	
					//~ });
		// -------------------   tabulator with regular columns
		this.tabulatorobj = new Tabulator(this.#internalContainer, {
						...this.tabulatorProperties,
						
						//rowHeader:{field:"_id", hozAlign:"center", headerSort:false, frozen:true},  
						//height:"311px",  
						index: "df_row_index",
						columns: this.generateColumnDefinitions(dfarray),
						//data: this.generateTableData(dfarray),
						data: "",    // this has to set to "" in order for ajaxRequestFunc to work
						// --------------------------------------
						pagination:true,
						paginationMode:"remote",
						paginationCounter:"rows",
						paginationSize:50,
						ajaxURL:"x",
						ajaxRequestFunc: this.internalDataFeed.bind(this),
						//progressiveLoad:"scroll",
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
		//  window.dftabulator.options.rowContextMenu[0].label = 'clickety click';
	}
	
	eventTableBuilt() {
		//~ window.exectimer.timeit("Showing dataframe 2 / eventTableBuilt/ changing columns...");
		//~ const columns = this.tabulatorobj.getColumns();
		//~ window.exectimer.timeit("Showing dataframe 2 / got columns...");
		//~ for (let i=1;i<columns.length;i++) {
			//~ window.exectimer.timeit("Processing column... "+i);
			//~ //columns[i].updateDefinition({title: this.columnsarray[i-1]});	
		//~ }
		this.eventbus.dispatch('tableBuilt', this);	
		window.exectimer.timeit("Showing dataframe 2 / done...");
	}
	
	generateColumnDefinitions(dfarray) {
		// this.columnstypes
		let res = [];
		let colwidth = 25;
		//  rownum formatter column 
		//~ colwidth = 25;
		//~ if (this.lastcolumnlayout) {
			//~ let oldlayout = this.lastcolumnlayout.find((e)=>e.formatter==="rownum");
			//~ if (oldlayout) {
				//~ colwidth = oldlayout?.width;
			//~ }
		//~ }
		//~ res.push({
			//~ formatter: "rownum",
			//~ width: colwidth
		//~ });
		//  df row index column
		
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
				//headerPopup: dfarray.columns[i], 
				//responsive:0, 
				frozen:false, 
				//headerContextMenu: headerContextMenuGenerator	
		});
				
		// columns with data from df
		for (let i=0;i<dfarray.columns.length;i++) {
			// this.lastcolumnlayout
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
				//headerPopup: dfarray.columns[i], 
				//responsive:0, 
				frozen:false, 
				//headerContextMenu: headerContextMenuGenerator	
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
		console.log("Internal Data Feed params: ",params);
		console.log("Internal Data Feed config: ",config);
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
			last_row = await this.pyodide.runPythonAsync(number_of_cols_command);
		} catch (err) {
			console.error(`Error getting ${this.dfname} rows number `,number_of_cols_command,err);
			// TODO: show error in place of a table?
			return false;
		}
		
		// ------------- 
		const rowstart = (params.page-1)*params.size;
		const rowend = rowstart + params.size;
		const get_data_command = this.dfname + `.iloc[${rowstart}:${rowend}].to_json(orient='split',date_format='iso')`;
		let dfarray = {};
		try {
			let output = await this.pyodide.runPythonAsync(get_data_command);
			dfarray = JSON.parse(output);
		} catch (err) {
			console.error(`Error getting ${this.dfname} data`,get_data_command,err);
			// TODO: show error in place of a table?
			return false;
		}
		// -------------
		res.last_row = last_row;
		res.last_page = Math.ceil(last_row/params.size); 
		res.data = this.generateTableData(dfarray);
		
		
		return new Promise(function(resolve, reject){
			//do some async data retrieval then pass the array of row data back into Tabulator
			console.log("Promise function called");
			resolve(res);
			//if there is an error call this function and pass the error message or object into it
			//reject();
		});
	}
	
}





async function showDataFrame() {
				console.log('Showing df');
				let pyodide = await window.pyodideReadyPromise;
				
				//   df.head(10).to_json(orient='split')
				// ----------------------------------------------
				
				window.exectimer.timeit("running command...");
				document.getElementById("pyrunningspinner").style.display = 'block';
				let getdfcmd = "df.to_json(orient='split')";
				let gettypescmd = "df.dtypes.to_json(orient='split',default_handler=str)";
				/* df memory usage df.memory_usage().sum()
				 *  df dimensions df.ndim  Return 1 if Series. Otherwise return 2 if DataFrame.
					df.shape - tuple of array dimensions (n_rows, n_cols)   
					let output = await pyodide.runPythonAsync(getdfcmd);
					let n_rows = output[0];  // output.length   //  output.type === 'tuple'
					let n_cols = output[1];
					let dfjs = pyodide.globals.get("df")  - get a global from pyodide
					dfjs.type === "DataFrame"
					dfjs.length  // number of records
				 */
				try {
					let output = await pyodide.runPythonAsync(getdfcmd);
					window.dfcontents = output;
					console.log(window.dfcontents);      //  output.toJs()  
					addToOutput(output,getdfcmd);
					let dfarray = JSON.parse(output);
					window.dfarray = dfarray;
					
					window.dftabulator.destroy();
					window.dftabulator = null;
					window.dftabulator = new Tabulator("#dftable", {
						spreadsheet:true,  
						rowHeader:{field:"_id", hozAlign:"center", headerSort:false, frozen:true},  
						height:"311px",  
						spreadsheetRows:dfarray.data.length,	
						spreadsheetColumns:dfarray.columns.length,	
						spreadsheetData:dfarray.data,  
						// --------------------------------------
						columnDefaults:{
							tooltip:function(e, cell, onRendered){
								var el = document.createElement("div");
								el.innerText = cell.getValue(); 
								return el; 
							},
						}	
					});
					
					window.dftabulator.on("tableBuilt", ()=>{ 
						let columns = window.dftabulator.getColumns();
						for (let i=1;i<columns.length;i++) {
							columns[i].updateDefinition({title: dfarray.columns[i-1]});	
							//console.log(dfarray.columns[i-1]);
						}
					});
					
					
										
				} catch (err) {
					addToOutput(err);
				}
				
				
					
				document.getElementById("pyrunningspinner").style.display = 'none';
				let timing = window.exectimer.timeit("done!");
				addToOutput("Exec time " + timing/1000+ " sec\n\n");
					
				
				//- -----------------------------------------
				
				//~ var data = [
				//~ [1,2],
				//~ [3,4]
				//~ ];
				//~ window.dftabulator.setSheetData(data);	
			}   // ---  /end Show Dataframe
