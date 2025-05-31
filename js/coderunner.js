/*******************
 * async Python and duckdb code runner
 * 
 *
 * 
 * 
 * ****************************/
import EventBus from "./eventbus.js";

export class CodeRunner {
	#pyodidePromise;
	//#dbconnPromise;
	#duckdbloader;
	#pyodideloader;
	#fileiohandler;
	
	constructor (params) {
		this.eventbus = new EventBus(this);
		//this.#pyodidePromise = params.pyodidePromise;
		//this.#dbconnPromise = params.dbconnPromise;
		this.#duckdbloader = params.duckdbloader;
		this.#pyodideloader = params.pyodideloader;
		this.#pyodidePromise = this.#pyodideloader.pyodideReadyPromise();
		this.#fileiohandler = params.fileIOHandler;
		
		this.pystate = 'not_running';
		this.dbstate = 'not_running';
		this.pyNameSpaces = new Map();
		this.cmdhistory = [];
		this.recordpystdout = false;
		this.pystdout = { strOutput: '', };
		
	}
	
	// --------------------------------------------------------------------------
	// --------------------------------------------------------------------------
	
	_pystatechange(newstate, addmessage='', params={}) {
		this.pystate = newstate;
		console.log(addmessage, params);
		this.eventbus.dispatch('pyodidestatechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}
	
	// --------------------------------------------------------------------------
	
	_dbstatechange(newstate, addmessage='', params={}) {
		this.dbstate = newstate;
		console.log(addmessage, params);
		this.eventbus.dispatch('dbstatechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}
	
	// --------------------------------------------------------------------------
	
	getpyodidePromise() {
		return this.#pyodidePromise;
	}
	
	// --------------------------------------------------------------------------
	async runAsync(targetEnv, cmd, appuuid="globals", namespace="") {
		if (targetEnv=="py") {
			return await this.runPythonAsync(cmd,appuuid,namespace);
		} else if (targetEnv=="sql") {
			return await this.runSQLAsync(cmd,appuuid,namespace);
		} else {
			const err_msg = 'Coderunner.runAsync: Wrong targetenv (should be py or sql) in command.';
			console.error(err_msg,cmd,appuuid,namespace)
			throw new Error(err_msg);
		}
		
	}
	
	// --------------------------------------------------------------------------
	async getPyNameSpace(namespaceuuid) {
		// let my_namespace = pyodide.globals.get("dict")();
		//  pyodide.runPython(`x = 1 + 1`, { globals: my_namespace });
		//  my_namespace.get("y");
		//let pyodide = await this.#pyodidePromise;
		
		return this.pyNameSpaces.get(namespaceuuid); 
		
	}
	
	// --------------------------------------------------------------------------
	
	async runPythonAsyncDirect(cmd, appuuid="globals", namespace="") {
		
		let pyodide = await this.#pyodidePromise;
		if (appuuid==="globals" || namespace==="globals") {
			return await pyodide.runPythonAsync(cmd);   
		} else {
			let namespaceuuid = appuuid;
			if (namespace && namespace?.length>0) {
				namespaceuuid = namespace;	
			}
			let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
			if (!pyodideNameSpace) {
				pyodideNameSpace = pyodide.globals.get("dict")();
				this.pyNameSpaces.set(namespaceuuid, pyodideNameSpace); 
			}

			return await pyodide.pyodide_py.code.eval_code_async(cmd, pyodideNameSpace);
		}
		
	}
	
	
	// ---------------------------------------------------------------------------
	async runPythonAsync(cmd, appuuid="globals", namespace="") {
		/* cmd - python command
		 * appuuid - uuid of the app tab/script to get a separate namespace
		 * namespace - uuid of the namespace, if omitted, appuuid is used
		 * 
		 * runs python command async and in a namespace defined by  appuuid  (like a script tab may have a uuid and execution happens in its own namespace)
		 * */
		
		
		let pyodide = await this.#pyodidePromise;
		const starttime = performance.now();   
		this._pystatechange('pyodide_running', 'Running python script...');
		
		let res = {
			targetEnv: 'py', 
			output: null,
			runStatus: undefined,
			runResult: "",
			error: null,
			errormessage: null,
			errorshort: null,
			errortype: null,
			errorline: null,
			lengthmilli: 0,
			lengthseconds: 0,
			executionTime: 0,
			uuid:  self.crypto.randomUUID(),  
		}
		
		if (typeof cmd === "string" && (cmd.toLowerCase().includes("print") || cmd.toLowerCase().includes("stdout.write"))) {
			this.recordpystdout = true;
		}
		
		try {
			
			if (this.recordpystdout) {
				this.pystdout.strOutput = '';
				pyodide.setStdout({ batched: this.stdoutPyBatched.bind(this) });
			}
			// attempt to auto load imports
			await pyodide.loadPackagesFromImports(cmd);
			
			if (appuuid==="globals" || namespace==="globals") {
				res.namespaceuuid = "globals";
				res.output = await pyodide.runPythonAsync(cmd);   //  await pyodide.pyodide_py.code.eval_code_async(code, pyodide.globals);
			} else {
				let namespaceuuid = appuuid;
				if (namespace && namespace?.length>0) {
					namespaceuuid = namespace;	
				}
				let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
				if (!pyodideNameSpace) {
					pyodideNameSpace = pyodide.globals.get("dict")();
					this.pyNameSpaces.set(namespaceuuid, pyodideNameSpace); 
				}
				res.namespaceuuid = namespaceuuid;
				res.output = await pyodide.pyodide_py.code.eval_code_async(cmd, pyodideNameSpace);
				
			}
			res.stdoutString = this.pystdout.strOutput;
			res.runStatus = true;
			res.runResult = "success";
			
			//console.log(res.output);      //  res.output.toJs()  
		} catch (err) {
			console.error(err);
			
			res.runStatus = false;
			res.runResult = "error";
			const errarr = err?.message?.split("\n").filter(e=>e.length>0);
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
			
			
			res.errorshort = pyerrmessageshort;
			res.errorline = pyerrorline;
			res.error = err;
			res.errortype = err?.type;  //  e.g. ZeroDivisionError
			res.errormessage = err?.message?.toString(); //  medium with stacktrace
			//const pyerrstack = err?.stack?.toString().length;   // longest output
		}
		
		res.lengthmilli = performance.now() - starttime;
		res.lengthseconds = res.lengthmilli / 1000;
		res.executionTime = Math.round(res.lengthmilli)/1000;
		
		
		// save history, everything except python output
		let historyitem = {
			cmd: cmd , 
			appuuid: appuuid, 
			namespace: namespace,
			batchlen: 0,
		};
		for (var i in res) {
			if (i==="output") continue;
			historyitem[i] = res[i];
		}
		this.cmdhistory.push(historyitem);
		
		// this is for global status - _success should turn off the spinner and signal that pyodide is ready again	
		this._pystatechange('pyodide_run_success', 'Python run completed!',
						{
							lengthmilli: res.lengthmilli,
							lengthseconds: res.lengthseconds/1000,
						}
					);
		return res;
	}
	
	// --------------------------------------------------------------------------
	
	async runSQLAsync(cmd, appuuid="app", namespace="") {
		let conn = await this.#duckdbloader.getdbconn();
		const starttime = performance.now();   
		this._dbstatechange('duckdb_running', 'Running duckdb query...');
		let res = {
			targetEnv: 'sql', 
			output: null,
			runStatus: undefined,
			runResult: "",
			error: null,
			errormessage: '',
			errorshort: null,
			errortype: null,
			errorline: null,
			lengthmilli: 0,
			lengthseconds: 0,
			executionTime: 0,
			uuid:  self.crypto.randomUUID(),  
		}
		
		// look for file references, register file handlers in duckdb for file names like '/app/*' in sql cmd.
		await this.checkFileHandlersInSQLcmd(cmd);
		try {
			res.output = await conn.query(cmd);
			res.runStatus = true;
			res.runResult = "success";
			//console.log(res.output);      //  res.output.toJs()  
		} catch (err) {
			console.error(err);
			
			res.runStatus = false;
			res.runResult = "error";
			res.errormessage = err?.message?.toString();
			const re = /LINE (\d+)/gi;
			const matcharr = res.errormessage?.match(re);
			if (matcharr && matcharr.length>0) {
						res.errorline = matcharr[0]?.replace("LINE ","");
					} else {
						res.errorline = '';
					}
			res.error = err;
			res.errorshort = res.errormessage;
		}
		
		res.lengthmilli = performance.now() - starttime;
		res.lengthseconds = res.lengthmilli / 1000;
		res.executionTime = Math.round(res.lengthmilli)/1000;
		
		let historyitem = {
			cmd: cmd , 
			appuuid: appuuid, 
			namespace: namespace,
			batchlen: 0,
		};
		for (var i in res) {
			if (i==="output") continue;
			historyitem[i] = res[i];
		}
		this.cmdhistory.push(historyitem);
		
		this._dbstatechange('duckdb_run_success', 'Duckdb query completed!',
						{
							lengthmilli: res.lengthmilli,
							lengthseconds: res.lengthseconds/1000,
						}
					);
					
		return res;
	}
	
	// ----------------------------------------------------------------------------------------------------------------------------------
	
	async runAsyncBatch(cmdarr, appuuid="globals", namespace="") {
		// cmdarr - array of type [ {	targetEnv: "py", scriptCode: "", stepOrder: 0,}, ... ]
		// then execute all returning last statement, show spinner for the whole run
		// should return an array with results for each step in a batch, but not output for each step, output should be returned only from a last step 
		// should stop on first error in a batch
		const firstPyInd = cmdarr.findIndex(el=>el.targetEnv==='py'); 
		const firstSqlInd = cmdarr.findIndex(el=>el.targetEnv==='sql');
		let resarr = [];
		let res = {
			targetEnv: '',   //  returns targetEnv of the last executed cmdarr item
			output: null,    //  returns the output of the last executed cmdarr item
			runStatus: null,
			runResult: "",
			stepID: '',
			stepOrder : -1,
			error: null,
			errormessage: null,
			errorshort: null,
			errortype: null,
			errorline: null,
			lengthmilli: 0,
			lengthseconds: 0,
			executionTime: 0,
			uuid:  self.crypto.randomUUID(),  
			runresults: resarr,
			
		};
		let conn = null;
		let pyodide = null;
		const starttime = performance.now(); 
		
		
		if (firstSqlInd>-1) {
			this._dbstatechange('duckdb_running', 'Running duckdb query...');
			conn = await this.#duckdbloader.getdbconn();
		}
		
		let pyodideNameSpace = undefined;
		
		if (firstPyInd>-1) {
			this._pystatechange('pyodide_running', 'Running python script...');
			pyodide = await this.#pyodidePromise;
			
			// -----------------------------------------
			if (appuuid==="globals" || namespace==="globals") {
				res.namespaceuuid = "globals";
				pyodideNameSpace = pyodide.globals;
			} else {
				let namespaceuuid = appuuid;
				if (namespace && namespace?.length>0) {
					namespaceuuid = namespace;	
				}
				pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
				if (!pyodideNameSpace) {
					pyodideNameSpace = pyodide.globals.get("dict")();
					this.pyNameSpaces.set(namespaceuuid, pyodideNameSpace); 
				}
				res.namespaceuuid = namespaceuuid;
			}
			
			// ------------------------------------------------
		}
		
		
		res.runStatus = true;
		res.runResult = "success";
		// --------------  run steps
			
		for (let i=0;i<cmdarr.length;i++) {
			const stepstarttime = performance.now(); 
			let stepres = {
				stepindex: i,
				targetEnv: cmdarr[i].targetEnv,
				cmd: cmdarr[i].scriptCode,
				stepID: cmdarr[i].stepID,
				stepOrder: cmdarr[i].stepOrder,
				runStatus: true,
				runResult: "success",
				error: null,
				errormessage: null,
				errorshort: null,
				errortype: null,
				errorline: null,
				lengthmilli: 0,
				lengthseconds: 0,
				executionTime: 0,
			};
			
			res.targetEnv = cmdarr[i].targetEnv; 
			res.stepID = cmdarr[i].stepID;
			res.stepOrder = cmdarr[i].stepOrder;  
			
			if (cmdarr[i].targetEnv==='py') {
				
				await pyodide.loadPackagesFromImports(cmdarr[i].scriptCode);
				try {
					res.output = await pyodide.pyodide_py.code.eval_code_async(cmdarr[i].scriptCode, pyodideNameSpace);
					
				} catch (err) {
					console.error(err);  // ---------------------
					
					res.runStatus = false;
					res.runResult = "error";
					const errarr = err?.message?.split("\n").filter(e=>e.length>0);
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
					
					res.errorshort = pyerrmessageshort;
					res.errorline = pyerrorline;
					res.error = err;
					res.errortype = err?.type; 
					res.errormessage = err?.message?.toString(); 
				}
				
				
			} else if (cmdarr[i].targetEnv==='sql') {
				await this.checkFileHandlersInSQLcmd(cmdarr[i].scriptCode);
				try {
					res.output = await conn.query(cmdarr[i].scriptCode);	
				} catch (err) {
					console.error(err);  //  -----
					
					res.runStatus = false;
					res.runResult = "error";
					res.errormessage = err?.message?.toString();
					const re = /LINE (\d+)/gi;
					const matcharr = res.errormessage?.match(re);
					if (matcharr && matcharr.length>0) {
						res.errorline = matcharr[0]?.replace("LINE ","");
					} else {
						res.errorline = '';
					}
					res.error = err;
					res.errorshort = res.errormessage;
				}
			}
			
			
			stepres.lengthmilli = performance.now() - stepstarttime;
			stepres.lengthseconds = stepres.lengthmilli / 1000;
			stepres.executionTime = Math.round(stepres.lengthmilli)/1000;
			if (!res.runStatus) { 
				stepres.runStatus = res.runStatus;
				stepres.runResult = res.runResult;
				stepres.error = res.error;
				stepres.errormessage = res.errormessage;
				stepres.errorshort = res.errorshort;
				stepres.errortype = res.errortype;
				stepres.errorline = res.errorline;
			}
			
			resarr.push(stepres);
			
			if (!res.runStatus) { break; }
			
		}
		
		// --------------  end running steps
		
		res.lastStepIndex = i;
		

		
		res.lengthmilli = performance.now() - starttime;
		res.lengthseconds = res.lengthmilli / 1000;
		res.executionTime = Math.round(res.lengthmilli)/1000;
		
		
		// save history, everything except python output
		let historyitem = {
			cmd: '' , 
			appuuid: appuuid, 
			namespace: namespace,
			batchlen: cmdarr.length,
		};
		for (var i in res) {
			if (i==="output") continue;
			if (i==="runresults") continue;
			historyitem[i] = res[i];
		}
		this.cmdhistory.push(historyitem);
		// ---------------------------------------
		
		if (firstPyInd>-1) {
			this._pystatechange('pyodide_run_success', 'Python run completed!',
						{
							lengthmilli: res.lengthmilli,
							lengthseconds: res.lengthseconds/1000,
						}
					);
		}
		if (firstSqlInd>-1) {
			this._dbstatechange('duckdb_run_success', 'Duckdb query completed!',
						{
							lengthmilli: res.lengthmilli,
							lengthseconds: res.lengthseconds/1000,
						}
					);
		}
		res.runresults = resarr;
		return res;
	}
	
	// --------------------------------------------------------------------------
	
	stdoutPyBatched(output) {
		this.pystdout.strOutput += output + "\n";	
	}
	
	// ----------------------------------------------------------------------------
	async checkFileHandlersInSQLcmd(inputString) {
		// file names expected inside single or double quotes, or $$__$$
		// trying to automatically create duckdb file handles for every filename like '/app/*/*'
		const regex = /(['"])(.*?)\1|\$\$(.*?)\$\$/g;
		//const matches = [];
		let match;
		try {			
			while ((match = regex.exec(inputString)) !== null) {
				// Check which group matched and push the corresponding substring
				if (match[2] !== undefined) {
					//matches.push(match[2]); // For '' and ""
					await this.#fileiohandler.checkDuckdbHandleForFileName(match[2]);
				} else if (match[3] !== undefined) {
					//matches.push(match[3]); // For $$
					await this.#fileiohandler.checkDuckdbHandleForFileName(match[3]);
				}
			}
		} catch (err) {
			console.error('Error processing file names/handle in sql.');
		}
		
		return true;
	}

	// ------------------------------------------------------------------------------
	
	extractPyError(err) {
		let res = {};
		const errarr = err?.message?.split("\n").filter(e=>e.length>0);
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
		
		res.errorshort = pyerrmessageshort;
		res.errorline = pyerrorline;
		res.error = err;
		res.errortype = err?.type; 
		res.errormessage = err?.message?.toString(); 	
		
		return res;
	}
	// ------------------------------------------------------------------------------
	
	/*
	 let variableVisual01 = {
			targetEnv: "py",
			namespaceuuid: this.appuuid,
			headertext: "Visual test",
			varName: "plot1",
			varType: "string",
		}; 
	*/
	async getVariableVisualValue(variableVisual,elementheight=400) {
		let pyodide = await this.#pyodidePromise;
		let res = {
			targetEnv: 'py', 
			output: null,
			runStatus: false,
			runResult: "",
			error: null,
			errormessage: null,
			errorshort: null,
			errortype: null,
			errorline: 0,
			lengthmilli: 0,
			lengthseconds: 0,
			executionTime: 0,
			uuid:  self.crypto.randomUUID(),  
			PlotlyFigure: null,
		};
		const get_plotly_html_cmd = `plotly.io.to_html(fig,config={'scrollZoom': True, 'responsive': True, 'toImageButtonOptions': {
        'format': 'svg', # one of png, svg, jpeg, webp
        'filename': 'test_chart',
        'height': 500,
        'width': 700,
        'scale': 1 # Multiply title/legend/axis/canvas sizes by this factor
    }
},include_plotlyjs=False,full_html=False,default_width="100%",default_height="${elementheight}px")
`;
		if (variableVisual.targetEnv === 'py') {
			
			let pyodideNameSpace = this.pyNameSpaces.get(variableVisual.namespaceuuid); 
			if (pyodideNameSpace) {
				try {
					if (pyodideNameSpace.has(variableVisual.varName)) {
						if (typeof pyodideNameSpace.get(variableVisual.varName) === variableVisual.varType || pyodideNameSpace.get(variableVisual.varName).type === variableVisual.varType) {
							if (variableVisual.varType==='Figure' && pyodideNameSpace.has('plotly') && pyodideNameSpace.get('plotly').type==='module') {
								res.output = await pyodide.pyodide_py.code.eval_code_async(get_plotly_html_cmd, pyodideNameSpace);
								res.PlotlyFigure = true;
								res.runStatus = true;
							} else {
								res.output = pyodideNameSpace.get(variableVisual.varName);	
								res.runStatus = true;
							}		
						} else {
							// error: incorrect type of variable
							res.errorshort = `Incorrect type of variable ${variableVisual.varName}, expected ${variableVisual.varType}`;
						}
									
					} else {
						// error: variable is not defined
						res.errorshort = `Variable ${variableVisual.varName} is not defined.`;
					}
				}
				catch (err) {
					// error: something is wrong with pyodideNameSpace 
					res.error = err;
					res.errortype = err?.type; 
					res.errormessage = err?.message?.toString(); 
					res.errorshort = `Error getting variable from pyodide environment: ${res.errormessage}`;
				}
			
			} else {
				res.errorshort = `Variable ${variableVisual.varName} is not defined. Pyodide namespace is not defined.`;				
			}

		} else {
			res.errorshort = "Incorrect target environment: " + variableVisual.targetEnv;
			res.errormessage = res.errorshort;
		}
		if (res.errorshort) { console.error(res.errorshort); }
		
		return res;
	}
	
	// -------------------------------------------------------------------------
	
	async getNameSpaceVars(namespaceuuid) {
		
		
		let pyodide = await this.#pyodidePromise;
		let pyodideNameSpace = this.pyNameSpaces.get(variableVisual.namespaceuuid); 
		
					/*
			 
			 g1.keys()
			g1.get("df").type			

			let g1 = window.coderunner.pyNameSpaces.get('27568fb8-1c81-4b14-ac49-a92d60bdb99e').toJs()
 
 'Figure'
 window.coderunner.pyNameSpaces.get('fe625998-4348-488c-93dd-c77e84cfa0a6').has('fig')
 window.coderunner.pyNameSpaces.get('fe625998-4348-488c-93dd-c77e84cfa0a6').has('plotly')
 window.coderunner.pyNameSpaces.get('fe625998-4348-488c-93dd-c77e84cfa0a6').get('plotly').type==='module'
			*/
		
		
	}
	
	
}
