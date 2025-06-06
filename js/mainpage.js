	const { get, set } = await import(
			  "https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js"
			);
			
			import { ExecTimer } from "./exectimer.js"; 
			import { dfAction, getdfActionsArray } from "./dfaction.js";
			import { TransformStep, TransformStepsControl } from "./dftransforms.js";
			import { FileSystemHandler } from "./fileshandlers.js";
			import { FormatSaver }  from "./formatsaver.js";
			import { FileUploadButton, FileDownLoadDialog } from "./filedialogs.js";
			import { TabulatorPicker } from "./tabupicker.js";
			import { DataFrameTableView } from "./dataframetableview.js";
			import { TransformTableView } from "./transformtableview.js";
			import { modalDialogInput } from "./modaldialoginput.js";
			
			// ------------------------------------------------------------------------
			async function main_py() {
				let pyodide = await loadPyodide();
				//  await pyodide.loadPackage("micropip");
				let timing = window.exectimer.timeit("Py Ready!");
				output.value += "Ready! ("+timing/1000+" sec)\n";
				document.getElementById("pyrunningspinner").style.display = 'none';
				return pyodide;
			}
			
			// ------------------------------------------------------------------------   
			function addToOutput(s,editorvalue="") {
				output.value += ">>>" + editorvalue + "\n" + s + "\n";
				output.scrollTop = output.scrollHeight;
			}
			// ------------------------------------------------------------------------
			async function evaluatePython(additional_char) {
				let pyodide = await window.pyodideReadyPromise;
				//console.log(additional_char);
				let add_string = '';
				console.log("additional_char: ", additional_char);
				if (typeof additional_char === 'string' || additional_char instanceof String) {
					add_string = additional_char; 
					console.log("additional_char: string ", add_string);
				}
				
				window.exectimer.timeit("running command...");
				document.getElementById("pyrunningspinner").style.display = 'block';
				let completedWithError = false;
				try {
					let output = await pyodide.runPythonAsync(editor1.getValue());
					console.log(output);      //  output.toJs()  
					let editorvalue = editor1.getValue(); 
					commandhistory += editorvalue + add_string;
					editor1.setValue("");
					addToOutput(output,editorvalue);
				} catch (err) {
					addToOutput(err);
					console.log(err);
					window.pylasterror = err;
					
					const errarr = err?.message?.split("\n").filter(e=>e.length>0);
					//~ const pyerrmessageshort = errarr?.length>0 ? errarr[errarr.length-1] : "";
					//~ //  extract line number of the eval'ed script from the errarr[errarr.length-2]:    "File "<exec>", line 1, in <module>"
					//~ // TODO: extract line with  error from input script
					//~ let pyerrorline = "";
					//~ if (errarr?.length>1) {
						//~ const re = /line (\d+)/gi;
						//~ const matcharr = errarr[errarr.length-2].match(re);
						//~ if (matcharr!==null && matcharr.length>0) {
							//~ pyerrorline = matcharr[0].replace("line ","");
						//~ }
					//~ }
					/*
import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('s3')
					 * 
					 * 
					 */ 
					//
					let pyerrmessageshort = "";
					let pyerrorline = "";
					let lastline = 0;
					const re = /line (\d+)/gi;
					for (let i=0;i<errarr?.length;i++) {
						const matcharr = errarr[i].match(re);
						if (matcharr!==null && matcharr.length>0) {
							lastline = i;
							if (errarr[i].includes('<exec>')) {
								pyerrorline = matcharr[0].replace("line ","");
							}
						}
					}
					for (let i=lastline+1;i<errarr?.length;i++) {
						pyerrmessageshort+=errarr[i]+'\n';
					}
					
					
					const pyerrtype = err?.type;  //  e.g. ZeroDivisionError
					const pyerrmessage = err?.message?.toString() //  medium with stacktrace
					const pyerrstack = err?.stack?.toString().length;   // longest output
					
					console.log("Short error: ", "line", pyerrorline,"\n", pyerrmessageshort);
					
					completedWithError = true;
				}
				
				document.getElementById("pyrunningspinner").style.display = 'none';
				let timing = window.exectimer.timeit("done!");
				addToOutput("Exec time " + timing/1000+ " sec\n\n");
			}
			// ------------------------------------------------------------------------
			function restoreCmdHistory() {
				editor1.setValue(commandhistory);
				commandhistory = "";
				editor1.focus();
			}
			
			// -------------------------------------------------------------------
			
			async function openDir() {
				console.log("open dir clicked");
				window.localdir = await mountDirectory("/mount_dir", "localdirhandle", "/app");
				
			}
			// ---------------------------------------------------------------------
			async function mountDirectory(pyodideDirectory, directoryKey, approotdir) {
				let directoryHandle = await get(directoryKey);
				let pyodide = await window.pyodideReadyPromise;
				const opts = {
					id: "mountdirid",
					mode: "readwrite",
				};
				await pyodide.FS.mkdir(approotdir);
				let opfsmountdirpath = approotdir+"/opfs";
				await pyodide.FS.mkdir(opfsmountdirpath);
				let localmountdirpath = approotdir+pyodideDirectory;
				await pyodide.FS.mkdir(localmountdirpath);
				let rootOPFS = await navigator.storage.getDirectory();
				let mountpointOPFS = await pyodide.mountNativeFS(opfsmountdirpath, rootOPFS);
				console.log("Mounted OPFS", opfsmountdirpath, rootOPFS, mountpointOPFS);

				if ('showDirectoryPicker' in self) {
					// The `showDirectoryPicker()` method of the File System Access API is supported.

					  if (!directoryHandle) {
						directoryHandle = await showDirectoryPicker(opts);
						await set(directoryKey, directoryHandle);
					  }
					  const permissionStatus = await directoryHandle.requestPermission(opts);
					  if (permissionStatus !== "granted") {
						throw new Error("readwrite access to directory not granted");
					  }
					  
					  var { syncfsres } = await pyodide.mountNativeFS(
						localmountdirpath,
						directoryHandle,
					  );
					  window.mountdirhandle = directoryHandle;
					  console.log("Mounted ", localmountdirpath, directoryHandle, syncfsres);
					  
				} else {
					console.error("File System Access API is not supported!");
				}
				
				  
				if (!syncfsres) { syncfsres = mountpointOPFS; }
				return syncfsres;
			}
			// -----------------------------------------------------------			
			async function syncMountedDirectory() {
				let pyodide = await window.pyodideReadyPromise;
				// https://github.com/pyodide/pyodide/blob/f8f026a5de496d71d1c6427e44ddcff8272f5dd4/src/js/nativefs.ts#L24
				// false = direction sync to disk
				pyodide.FS.syncfs(false, (err)=>{ 
								if (err) {console.log(err);}
								pyodide.FS.syncfs(true, (err)=>console.log("Data sync to disk done",err));
							}
				);
				
			}
			// -----------------------------------------------------------	
			async function showFilePickerTest() {
				// id or startIn works in Chrome (windows), does not work in Chromium (debian)
				const opts = {
					//id: "filepickertest",
					mode: "readwrite",
					startIn: window.lastfilepicker,
					multiple: true,
				};
				let fileHandler = await showOpenFilePicker(opts);
				[window.lastfilepicker] = fileHandler;
				console.log(fileHandler);	
			}
			
			// ---------------------------
			// ---------------------------
			
			async function loadDataFrame() {
				console.log('Loading df');
				const loadingCommands = `import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('pandas')
await micropip.install('openpyxl')
import pandas as pd
import openpyxl
file = pd.ExcelFile('/app/mount_dir/onlineretail2.xlsx') 
#file.sheet_names
df = pd.DataFrame()
df = pd.concat([df, pd.read_excel(file,sheet_name='Sheet2', skiprows=0)], ignore_index=True)
`;
				editor1.setValue(loadingCommands);
				console.log(loadingCommands);
				await evaluatePython();
								
			}
			
			// ---------------------------
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
			
			async function showDataFrame2() {
				console.log("Showing dataframe 2");
				window.exectimer.timeit("Showing dataframe 2...");
				if (window.testdataframe2) {
					
					await window.testdataframe2.showdf();
					
				}
			}
			
			// ------------------- show code in editor
			
			async function showCodeTextinEditor(codetext,callback) {
				console.log(codetext);
				let curEditorContents = editor1.getValue();
				if (curEditorContents.length>0) { curEditorContents += "\n"; }
				editor1.setValue(curEditorContents + codetext);
			}
			
			// ------------------------------------------
			function getCodeTextFromEditor() {
				return editor1.getValue();
				
			}
			
			
			// ---------------------------  show file selection dialog
			
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
			
			
			async function testOptionPicker(picker) {
				console.log("test option picker click");
				
				
				const data = [
				  { id: 1, name: "John Doe", age: 30 },
				  { id: 2, name: "Jane Smith", age: 25 },
				  { id: 3, name: "Bob Johnson", age: 35 },
				  { id: 4, name: "Alice Williams", age: 28 },
				];

				const columns = [
					{ title: "ID", field: "id" },
					{ title: "Name", field: "name" },
					{ title: "Age", field: "age" },
				 ];
				
				let tabulatoroptions = {
					data: data,
					columns: columns,
					dialogTitle : "Select something from a list:"
				};
				try {
					const selectedOption = await picker.showoptions(tabulatoroptions);
					console.log('Selected option:', selectedOption);
				} catch (error) {
					console.error('Error:', error.message);
				}
			}
			
			// ----------------------------
			async function showChartTest() {
				let pyodide = await window.pyodideReadyPromise;
				let output1 = "";
				window.exectimer.timeit("running command...");
				document.getElementById("pyrunningspinner").style.display = 'block';
				try {
					
				/* plot1 = plotly.io.to_html(fig,config={scrollZoom: true, toImageButtonOptions: { format: 'svg',filename: 'testchart', height: 500, width: 700, scale: 1  },responsive: true},include_plotlyjs=False,full_html=False)
				 */	
					output1 = await pyodide.runPythonAsync(`import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('plotly')
await micropip.install('pandas')
import numpy
import plotly
import plotly.express as px
"""fig = px.treemap(
    names = ["Eve","Cain", "Seth", "Enos", "Noam", "Abel", "Awan", "Enoch", "Azura"],
    parents = ["", "Eve", "Eve", "Seth", "Seth", "Eve", "Eve", "Awan", "Eve"]
)
fig.update_traces(root_color="lightgrey")
fig.update_layout(margin = dict(t=50, l=25, r=25, b=25))

df1 = px.data.gapminder().query("continent=='Oceania'")
fig = px.line(df1, x="year", y="lifeExp", color='country')
"""
df1 = px.data.stocks()
fig = px.line(df1, x='date', y="GOOG")
plot1 = plotly.io.to_html(fig,config={'scrollZoom': True, 'responsive': True, 'displaylogo': True, 'displayModeBar': True, 'toImageButtonOptions': {
        'format': 'svg', # one of png, svg, jpeg, webp
        'filename': 'test_chart',
        'height': 500,
        'width': 700,
        'scale': 1 # Multiply title/legend/axis/canvas sizes by this factor
    }
},include_plotlyjs=False,full_html=False)
plot1`);
				} catch (err) {
					console.error('Error running chart test',err);
				}
				let container = document.querySelector("#chartcontainer1");
				console.log("output: ",output1);
				try {
					container.innerHTML = output1;
					eval(document.querySelector("#chartcontainer1").querySelector('script').innerText);
				} catch (err) {
					console.error('Error initializing running chart test',err);
				}
				document.getElementById("pyrunningspinner").style.display = 'none';
				let timing = window.exectimer.timeit("done!");
				addToOutput("Exec time " + timing/1000+ " sec\n\n");
				
			}
			
			
			
			// ----------------------------
			// ----------------------------
			window.exectimer = new ExecTimer({msgtext:"Initializing pyodide..."});
			window.pyodideReadyPromise = main_py();
			window.localFileHandler = new FileSystemHandler({pyodidePromise: window.pyodideReadyPromise});
			window.localFormatSaver = new FormatSaver({pyodidePromise: window.pyodideReadyPromise, dbFileName: "/app/mount_dir/default.dbsqlite"});
			const fileuploaddialog = new FileUploadButton({containertemplateid: "#uploadbuttontemplate", containerid:"#fileuploaddialogplaceholder",  fileSystemHandler: window.localFileHandler });
			const filesaveasdialog = new FileDownLoadDialog({fileSystemHandler: window.localFileHandler});
		
			let commandhistory = "";

			var editor1 = CodeMirror.fromTextArea(document.getElementById("pycode"), {
				mode: {name: "python",
					   version: 3,
					   singleLineStringErrors: false},
				lineNumbers: true,
				indentUnit: 4,
				matchBrackets: true,
				theme: "cobalt",
				autofocus: true,
				extraKeys: {
				  "Shift-Enter": function(cm) {
					//console.log("shift-enter pressed (codemirror)"); 
					evaluatePython("\n");
				  },
				  "Tab": function(cm) {
					var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
					cm.replaceSelection(spaces);
				  },
				  "Alt-A": "toggleComment"
				}
			});

			document.getElementById("opendirbutton1").addEventListener("click", openDir);
			document.getElementById("runpycode").addEventListener("click", async()=>{await evaluatePython();});
			document.getElementById("showhistory").addEventListener("click", restoreCmdHistory);
			document.getElementById("synctodisk").addEventListener("click", syncMountedDirectory);
			document.getElementById("showfilepicker").addEventListener("click", showFilePickerTest);
			//showfiledialog  showFileSelectionDialog
			document.getElementById("showfiledialog").addEventListener("click", showFileSelectionDialog);
			
			document.getElementById("loaddataframe").addEventListener("click", loadDataFrame);
			document.getElementById("showdataframe").addEventListener("click", showDataFrame);
			document.getElementById("showdataframe2").addEventListener("click", showDataFrame2);
			
			document.getElementById("showplotlyhtml").addEventListener("click", showChartTest);
			
			// testshowpicker
			document.getElementById("testshowpicker").addEventListener("click", async ()=>{await testOptionPicker(testpicker)});
			
			document.getElementById("testmodalinputdialog").addEventListener("click", async ()=>{
				console.log("test input dialog click");
				
				try {
					const props = {
						dialogTitle: "Enter one line of text here:",
						inputOneLine: "Initial value",
						inputOneLinePlaceHolder: "nothing as a placeholder",
					};
					const selectedOption = await testmodalDialogInput.showdialog(props);
					console.log('Return value:', selectedOption);
				} catch (error) {
					console.error('Error:', error.message);
				}
					
			});
			
			
			var testpicker = new TabulatorPicker({templateid:"#tabulatorpickertemplate"});
			var testmodalDialogInput = new modalDialogInput({templateid:"#editfieldvaluetemplate"});
			
			//  df table 1
			window.dftabulator = new Tabulator("#dftable", {
				spreadsheet:true,
				spreadsheetData:[[1,2,3],[4,5,6],[7,8,9]],
				rowHeader:{field:"_id", hozAlign:"center", headerSort:false, frozen:true},  
				
				height:"211px",  
				spreadsheetRows:3,	
				spreadsheetColumns:3,
				// ----------------
				columnDefaults:{
					tooltip:function(e, cell, onRendered){
						//e - mouseover event
						//cell - cell component
						//onRendered - onRendered callback registration function
						
						var el = document.createElement("div");
						//el.style.backgroundColor = "red";
						//el.innerText = cell.getColumn().getField() + " - " + cell.getValue(); //return cells "field - value";
						el.innerText = cell.getValue(); //return cells "field - value";
						return el; 
					},
				},
				// ----------
				selectableRange:1, 
				selectableRangeColumns:true,
				selectableRangeRows:true,	
				//--------------------
				spreadsheetColumnDefinition:{
						//editor:"input",
						contextMenu:[
							{
								label:"Cell context menu",
								action:function(e, cell){
									//cell.setValue("");
									let curColumn = cell.getColumn();
									let colIndex = curColumn.getTable().getColumnLayout().findIndex((el)=>el.field===curColumn.getField());
									console.log(cell,"row=",cell.getRow().getIndex(),"column=",colIndex);
									
								}
							},
						],
						headerContextMenu:[
							{
								label:"Column header context menu",
								action:function(e, column){
									column.updateDefinition({title:"Updated Title"});
									let colIndex = column.getTable().getColumnLayout().findIndex((el)=>el.field===column.getField());
									console.log(column,"column=",colIndex);
								}
							},
						],
					},
				//-------------
				rowContextMenu:[
					{
						label:"Click here Row",
						action:function(e, row){
							console.log(e);
							console.log(row,"row=",row.getIndex());
						}
					},
				]
			});
			
			window.dftabulator.on("tableBuilt", ()=>{ 
				let columns = window.dftabulator.getColumns();
				columns[1].updateDefinition({title: 'test1', hozAlign:"center", formatter:"money", });	
			});
			
			
			
			// clearoutput
			document.getElementById("clearoutput").addEventListener("click", ()=>{
					document.getElementById("pyoutput").value = ''; 
				});
			
			
			//~ document.getElementById("pycode").addEventListener("keypress", (event) => {
					//~ if (event.keyCode == 13 && event.shiftKey) {
						//~ console.log("shift-enter pressed"); 
						//~ event.preventDefault();
						//~ return false;
					//~ }
				//~ });
			const output = document.getElementById("pyoutput");
			output.value = "Initializing...\n";
			document.getElementById("pyrunningspinner").style.display = 'block';
			
						
			window.filepickerid = 0;
					
			window.teststeps = new TransformStepsControl({
					containerid: "#TransformationSteps",
					containertemplateid : "#transformtemplate",
					outputcodefunc: showCodeTextinEditor,
					getcodefunc: getCodeTextFromEditor,
					pyodideobject: undefined,
					duckdbconn: undefined,
					scriptname: "testscript",
					transformscript: {
						srcfiles: [],
						destfiles: [],
						filesdirectory: "/app/mount_dir",
						transformSteps: [
							{
								stepOrder: 0,
								targetEnv: "py",
								srcDfActionId: "",
								srcDfActionName: "Import file",
								scriptCode: "file = pd.ExcelFile('/app/mount_dir/onlineretail2.xlsx')",
								targetDataframe: "df",
								mutations: ["df","file"], 
								lastRunStatus: true,
								lastRunResult: "",
								executionTime: 0,
								stepactive: true,
							 },
							 {
								stepOrder: 1,
								targetEnv: "py",
								srcDfActionId: "",
								srcDfActionName: "Import file as excel",
								scriptCode: "df = pd.read_excel(file,sheet_name='Sheet2', skiprows=0)",
								targetDataframe: "df",
								mutations: ["df","file"], 
								lastRunStatus: undefined,
								lastRunResult: "",
								executionTime: 0,
								stepactive: true,
							 },
						],
						lastRunStepNum: 0,
						lastRunStatus: "success",
						lastRunResult: "",
						executionTime: 0,
						
					},
				});
			
			// df table 2
			window.testdataframe2 = new TransformTableView({
						pyodidePromise: window.pyodideReadyPromise, 
						containerid: "#dftable2",
						dfname: "df",
						tabulatorProperties: { height:"311px", },
					});
			
			window.testdataframe2.eventbus.subscribe('tableBuilt',()=>{ console.log("df2 table built"); });
			window.testdataframe2.eventbus.subscribe('dfActionEvent',(obj,eventdata)=>{ console.log("dfActionEvent",obj,eventdata);  window.teststeps.addScriptStep(eventdata);  });
			window.teststeps.eventbus.subscribe('dfViewReloadEvent',(obj,eventdata)=>{ console.log("dfViewReloadEvent",obj,eventdata);  window.testdataframe2.showdf(); });
			
			window.testdfaction = new dfAction({actionid:"DeleteColumnByIndex",parameters:{df:"df",colnum:"2"}});
			console.log(window.testdfaction, window.testdfaction.pycode());
			
			/*
await micropip.install('regex')

import os
#f1 = open("/app/mount_dir/sometextfile.txt",'w')
#f1.write("This is a test line 1\nAnd this is line 2\n")
#f1.close()
f1 = open("/app/mount_dir/sometextfile.txt",'r+')
f1_contents = f1.read()
f1.close()
f1_contents

py.loadPackage("micropip")
py.loadPackage("duckdb")
py.loadPackage("sqlite3")

import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install("sqlite3")
import sqlite3

cn1 = sqlite3.connect("file:db.file?vfs=opfs")
c = cn1.cursor()
cn1.execute("SELECT 2+2;").fetchall()


res = cn1.execute("SELECT 2+2;").fetchall()
res

cn1.execute("create table tbl01 (id INTEGER, name TEXT);")
cn1.execute("INSERT INTO tbl01 (id, name) VALUES (1,'row one');")
cn1.execute("SELECT * FROM tbl01;").fetchall()
cn1.commit()
cn1.close()


# -----------

let py = await window.pyodideReadyPromise;
let root = await navigator.storage.getDirectory();

# https://parzibyte.me/blog/en/2023/10/06/javascript-store-read-files-origin-private-file-system/
let fileHandle = await root.getFileHandle('test1', {
                create: true,
            });
            let writable = await fileHandle.createWritable();
            await writable.write('test');
            await writable.close();



py.loadPackage(["micropip", "sqlite3"]);
let mountpoint = await py.mountNativeFS("/nativefs", root);
py.FS.analyzePath("/");
py.FS.syncfs(false,()=>{})
py.FS.analyzePath("/nativefs");

import sqlite3
cn1 = sqlite3.connect("/nativefs/test1.db")
c = cn1.cursor()
cn1.execute("create table tbl01 (id INTEGER, name TEXT);")
cn1.execute("INSERT INTO tbl01 (id, name) VALUES (1,'row one');")
cn1.execute("SELECT * FROM tbl01;").fetchall()
cn1.commit()
cn1.close()

import os
os.listdir("/nativefs")

# ---------------------------------------
duckdb shell:
.files register opfs://test.csv  
copy (select * from t1) to 'opfs://test.csv'; 
#-----------------


# file:db.file?vfs=opfs
cn1 = sqlite3.connect("/app/mount_dir/test1.db")
c = cn1.cursor()
res = cursor.execute("SELECT * FROM tbl01").fetchall()
res
cn1.commit()
cn1.close()

			
import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('pandas')
import pandas as pd
await micropip.install('openpyxl')
import openpyxl

workbook = openpyxl.open('/app/mount_dir/onlineretail2.xlsx', read_only=True)
sheet_names = workbook.sheetnames
workbook.close()
sheet_names  # change here

df = pd.read_excel('/app/mount_dir/onlineretail2.xlsx',sheet_name='Sheet2', skiprows=0)
			
			
========


file = pd.ExcelFile('/app/mount_dir/onlineretail2.xlsx') 
file.sheet_names
df = pd.read_excel(file,sheet_name='Sheet2', skiprows=0)

# https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_json.html#pandas.DataFrame.to_json
df.head(10).to_json(orient='records', lines=True)

df.head(10).to_json(orient='split')
#  - json arrays:   columns, index, data

-------------
# drop column 0  ,  axis=1 argument tells Pandas to drop the column (as opposed to dropping a row, which would be axis=0).
df = df.drop(df.columns[0], axis=1) 

# ===================================   delete columns left/right
# delete 2 first columns
df = df.iloc[:, 2:]
# ===================================   delete rows left/right
# delete first 4 rows
df = df.iloc[4:]

# ===================================   delete one column middle
df.drop(df.columns[2], axis=1, inplace=True)

# ===================================   delete one row
df.drop(df.index[2], inplace=True)

# ===================================   fill down values

df.iloc[:, 3] = df.iloc[:, 3].fillna(method='ffill')

# ===================================  column types
df = df.infer_objects()
df.dtypes
# pandas.to_datetime
#  https://pandas.pydata.org/docs/user_guide/basics.html#basics-dtypes
#  df['A'] = df['A'].astype(int)
df[df.columns[0]] = df[df.columns[0]].astype('string')
* df[df.columns[1]] = df[df.columns[1]].astype('string')
df['Country'] = df['Country'].astype('string')
df.to_parquet('/app/opfs/dftest2.parquet',engine='pyarrow', compression='zstd')
df.to_parquet('/app/opfs/dftest3.parquet',engine='fastparquet', compression='zstd')

# ===================================   filter by value

# ===================================   rename columns 

# ===================================   rename columns from row value
df.rename({"num": "number", "let": "letter"}, axis="columns", inplace=True)

# rename columns from row values:
col_counts = {}
new_cols = []
for col in df.iloc[0]:
    if col in col_counts:
        col_counts[col] += 1
        new_col = f"{col}_{col_counts[col]}"
    else:
        col_counts[col] = 1
        new_col = col
    new_cols.append(new_col)
df.columns = new_cols
* 
##################################
* 
* .isnull()
data = [["a", "b", None, "c", "b" ], [1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]
df = pd.DataFrame(data)
##
col_counts = {}
new_cols = []
for index, col in enumerate(df.loc[0]):
    if df.loc[0].isna()[index] or len(str(col)) == 0:
        print(col)
        new_col = df.columns[index]
    else:
        if col in col_counts:
            col_counts[col] += 1
            new_col = f"{col}_{col_counts[col]}"
        else:
            col_counts[col] = 1
            new_col = col
    new_cols.append(new_col)
df.columns = new_cols

# ===================================   add row with values?

# # =================================== convert type        https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.infer_objects.html

#  convert excel datetime
df['Unnamed: 7'] = pd.to_datetime(df['Unnamed: 7'], unit='ms', errors='ignore')    (coerce / to make NaT)
df.iloc[:, 4] = pd.to_datetime(df.iloc[:, 4], unit='ms', errors='ignore')
* 
* 
#  iterate over dataframe - return rows from 10 to 15 from pandas dataframe # Get the rows from 10 to 15 (inclusive)  
rows_10_to_15 = df.iloc[9:16].to_json(orient='split')

#  read csv from http
import pyodide.http
import io
with pyodide.http.open_url('https://raw.githubusercontent.com/Tanishqa-10/AskPython/main/Sampledata.csv') as f:
    df = pd.read_csv(io.StringIO(f.getvalue()), sep=",");

##
import pyodide.http
import io
with pyodide.http.open_url('https://raw.githubusercontent.com/walethewave/Practicing_Data_Analysis/refs/heads/main/1.04.%20Real-life%20example.csv') as f:
    df = pd.read_csv(io.StringIO(f.getvalue()), sep=",");

df = df1
df = pd.DataFrame(df['Brand'].drop_duplicates().sort_values())







#  read csv from google sheets:
import pyodide.http
import io
with pyodide.http.open_url('https://docs.google.com/spreadsheets/d/{KEY}/export?format=csv') as f:
    df = pd.read_csv(io.StringIO(f.getvalue()));


# read excel from http (google docs gives zip errors)
import pyodide.http
import io
with pyodide.http.open_url('https://docs.google.com/spreadsheets/d/{KEY}/export?format=xlsx') as f:
    df = pd.read_excel(io.StringIO(f.getvalue()),sheet_name='Sheet1', skiprows=0);
    

=======
			
---------------
var py = await window.pyodideReadyPromise;	
py.globals.get("df")

------------
df.tail(3).to_json(orient='records', lines=True)
await micropip.install("duckdb") 
import duckdb
duckdb.sql("select version();")
duckdb.sql("CREATE TABLE ordertimes AS SELECT * FROM df2")
duckdb.sql("select * from ordertimes limit 10;")
duckdb.sql("CREATE TABLE bigorderitems AS SELECT * FROM df")
duckdb.sql("select count(*) from bigorderitems;")
duckdb.sql("COPY bigorderitems TO '/app/mount_dir/bigorderitems.parquet' (FORMAT PARQUET, COMPRESSION 'zstd');")

duckdb.sql("COPY bigorderitems TO '/app/mount_dir/bigorderitems.parquet' (FORMAT PARQUET, COMPRESSION 'zstd');")
----
#py
duckdb.sql("COPY df TO '/app/opfs/dftrans.parquet' (FORMAT parquet, COMPRESSION zstd);")
#syncFS
#js
await window.duckdb.db.registerFileHandle('dftrans.parquet', null, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true)
# duckdb
r1 = await duckdb.conn.query("CREATE OR REPLACE TABLE t2 as (FROM 'dftrans.parquet');"); JSON.stringify(r1.toArray())
# if table  exists: * 
r1 = await duckdb.conn.query("COPY t2 FROM 'dftrans.parquet' (FORMAT parquet);"); JSON.stringify(r1.toArray())

alt route
* await micropip.install("fastparquet")  or await micropip.install("pyarrow")

df.to_parquet('/app/opfs/df2.parquet',engine='fastparquet',compression='zstd')
* 
* 
-----
COPY lineitem TO 'zstd_v2.parquet' (COMPRESSION zstd, PARQUET_VERSION V2);  !!

//  pandas df and pyarrow
https://arrow.apache.org/docs/python/pandas.html
await pyodide_js.loadPackage('pyarrow')
import pyarrow
table = pyarrow.Table.from_pandas(df)
df_new = table.to_pandas()

duckdb back to df:
df = duckdb.sql("SELECT 42").df()
# https://duckdb.org/docs/stable/clients/python/conversion.html


in JS:
var file01 = py.FS.readFile('/app/mount_dir/bigorderitems.parquet')

find object in FS
py.FS.findObject("/app/mount_dir")

py.FS.findObject("/app/mount_dir").contents

for (const el in py.FS.findObject("/app/mount_dir").contents) { console.log(py.FS.findObject("/app/mount_dir").contents[el].isFolder, py.FS.findObject("/app/mount_dir").contents[el].mount.mountpoint,py.FS.findObject("/app/mount_dir").contents[el].name,py.FS.findObject("/app/mount_dir").contents[el].usedBytes,py.FS.findObject("/app/mount_dir").contents[el].isDevice);  break; }

not ->  present py.FS.findObject("/app/mount_dir1")===null

let resp=py.runPython(`
import os
os.listdir('/app/mount_dir')
`);  
console.log(resp.toJs());
			
			
----------------python parsing
import ast
code_text = """import os
os.listdir("/app/mount_dir")
"""
tree = ast.parse(code_text)
#top_level_commands = [ast.dump(node) for node in tree.body]
#top_level_code = [compile(ast.parse(cmd), filename="<ast>", mode="exec") for cmd in top_level_commands]

----------------------
# https://docs.python.org/3/library/ast.html#ast.unparse
import ast
code_text = """import os
os.listdir("/app/mount_dir")
"""
tree = ast.parse(code_text)
top_level_commands = [ast.unparse(node) for node in tree.body]
top_level_commands
			
-----
import zipfile

---------------------
import osawait micropip.install("cryptography")
from cryptography.fernet import Fernet
key = Fernet.generate_key()
f = Fernet(key)
token = f.encrypt(b"my deep dark secret")
token
f.decrypt(token)

----------------------------

#hashes
import hashlib
with open('/app/mount_dir/onlineretail2.xlsx', "rb") as f:
    file_hash = hashlib.blake2b()
    while chunk := f.read(8192):
        file_hash.update(chunk)
#file_hash.digest()
file_hash.hexdigest() 

--------------------------
crypto
await micropip.install('cryptography')   #https://cryptography.io/en/latest/fernet/

------------------------------------
#filestats
import pathlib
fname = pathlib.Path('/app/mount_dir/Online Retail.xlsx')
assert fname.exists(), f'No such file: {fname}'  # check that the file exists
fname.stat()
fname.stat().st_size

------------------
#pyodide globals 

let g1 = pyodide.globals.toJs()
g1.keys()
g1.get("df").type			

let g1 = window.coderunner.pyNameSpaces.get('27568fb8-1c81-4b14-ac49-a92d60bdb99e').toJs()


----------------------
#pyodide FS delete remote entries hack
py.FS.filesystems.NATIVEFS_ASYNC.removeRemoteEntry = function() { console.log("HACKED!"); }
#original   py.FS.filesystems.NATIVEFS_ASYNC.removeRemoteEntry =
async(n,o)=>{await n.get(r.dirname(o)).removeEntry(r.basename(o)),n.delete(o)}

py.FS.filesystems.NATIVEFS_ASYNC.removeRemoteEntry = async function(n,o) { console.log("HACKED!",n,o); }


------
ATTACH 'https://blobs.duckdb.org/data/test.db' as db;
from db.t;


----------
* 
import pandas as pd
import openpyxl
file = pd.ExcelFile('/app/mount_dir/Online Retail.xlsx')
df = pd.read_excel(file, skiprows=0, nrows=500, usecols="B:Q")
* 
* 
------------------------
* https://duckdb.org/duckdb-docs.md
await micropip.install('markdown')
import markdown
html = markdown.markdown('# Hello World')
html
---------------
* drag tabulator rows
* https://tabulator.info/docs/6.3/move#rows-element

---------------------------------
import openpyxl
workbook = openpyxl.open('/app/mount_dir/testdir/onlineretail2_android.xlsx', read_only=True)
sheetinfo = []
for sheet in workbook:
	numrows = 0
	numcols = 0
	sheettitle = ""
	try:
		sheettitle = sheet.title
	except:
		sheettitle = "Sheet1"
	try:
		numrows = sheet.max_row - sheet.min_row + 1
		numcols = sheet.max_column - sheet.min_column + 1
	except:
		numrows = 0
		numcols = 0    
	sheetinfo.append({"sheetname":sheet.title, "numrows": numrows, "numcols": numcols })
workbook.close()
sheetinfo

--------------------------------------------
* 
* https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.savefig.html#matplotlib.pyplot.savefig
import micropip
await micropip.install('matplotlib')
import matplotlib.pyplot as plt
import io
plt.plot([1, 2, 3, 4], [1, 4, 9, 16])
plt.tight_layout()
buffer = io.BytesIO()
plt.savefig(buffer, format='svg')
plot1 = buffer.getvalue().decode()
svg_data


# ===========================================
import micropip
await micropip.install('plotly')
import numpy
import plotly
import plotly.express as px
df1 = px.data.stocks()
fig = px.line(df1, x='date', y="GOOG")
plot1 = plotly.io.to_html(fig,config={'scrollZoom': True, 'responsive': True, 'displaylogo': True, 'displayModeBar': True, 'toImageButtonOptions': {
        'format': 'svg', # one of png, svg, jpeg, webp
        'filename': 'test_chart',
        'height': 500,
        'width': 700,
        'scale': 1 # Multiply title/legend/axis/canvas sizes by this factor
    }
},include_plotlyjs=True,full_html=True)
plot1

# =============================================
import micropip
await micropip.install('plotly')
import numpy
import plotly
import plotly.express as px
df1 = px.data.stocks()
fig = px.line(df1, x='date', y="GOOG")
fig.update_layout(
    margin=dict(l=5, r=5, t=5, b=5),
)
plot1 = plotly.io.to_html(fig,config={'scrollZoom': True, 'responsive': True, 'toImageButtonOptions': {
        'format': 'svg', # one of png, svg, jpeg, webp
        'filename': 'test_chart',
        'height': 500,
        'width': 700,
        'scale': 1 # Multiply title/legend/axis/canvas sizes by this factor
    }
},include_plotlyjs=False,full_html=False,default_width="100%",default_height="373px")

* 
* 
* 
* 
* 
* 
* 
* 
import micropip
await micropip.install('matplotlib')
await micropip.install('plotly')


import matplotlib.pyplot as plt
import io
plt.plot([1, 2, 3, 4], [1, 4, 9, 16])
plt.tight_layout()
buffer = io.BytesIO()
plt.savefig(buffer, format='svg')
plot1 = buffer.getvalue().decode()
import numpy
import plotly
import plotly.express as px
df1 = px.data.stocks()
fig = px.line(df1, x='date', y="GOOG")
fig.update_layout(
    margin=dict(l=5, r=5, t=5, b=5),
)


import plotly.express as px

df = px.data.gapminder().query("year==2007")
fig = px.choropleth(df, locations="iso_alpha",
                    color="lifeExp", # lifeExp is a column of gapminder
                    hover_name="country", # column to add to hover information
                    color_continuous_scale=px.colors.sequential.Plasma)

* 
			*/
