/********************************
 *  Depends on a tabulator
 * 
 * 
 * *******************************/

import EventBus from "./eventbus.js";


export class DataFrameTableView {
	constructor(params) {
		
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
