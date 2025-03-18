/********************************
 *  requires Tabulator.js
 * 
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
				this.tabulatorobj.destroy();
			}
		} catch (err) {}
		//  get data from a df
		let dfarray = {};
		try {
			const output = await this.pyodide.runPythonAsync(this.getdfcmd);
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
						
						rowHeader:{field:"_id", hozAlign:"center", headerSort:false, frozen:true},  
						//height:"311px",  
						spreadsheetRows: dfarray.data.length,	
						spreadsheetColumns: dfarray.columns.length,	
						spreadsheetData: dfarray.data,  
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
