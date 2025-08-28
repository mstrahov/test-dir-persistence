/*******************
 * async Python and duckdb code runner
 * 
 * depends on duckdb, pyodide, arrow, luxon
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
	#defersql;
	#resolvesql;
	#rejectsql;
	
	constructor (params) {
		
		this.#defersql = new Promise((res, rej) => {
		  this.#resolvesql = res;
		  this.#rejectsql = rej;
		});
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
		
		this.#resolvesql();
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
			let linewithexec = 0;
			const re = /line (\d+)/gi;
			for (let i=0;i<errarr?.length;i++) {
				const matcharr = errarr[i].match(re);
				if (matcharr!==null && matcharr.length>0) {
					lastline = i;
					if (errarr[i].includes('<exec>')) {
						linewithexec = i;
						pyerrorline = matcharr[0].replace("line ","");
					}
				}
			}
			if (lastline===linewithexec && (lastline+1)<errarr?.length) {
				lastline++;
			}
			for (let i=lastline;i<errarr?.length;i++) {
				pyerrmessageshort+=errarr[i]+'\n';
			}
			if (pyerrmessageshort === "") {
				pyerrmessageshort = err?.message?.toString();
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
		
		await this.#defersql;
		this.#defersql = new Promise((res, rej) => {
		  this.#resolvesql = res;
		  this.#rejectsql = rej;
		});
		let conn = await this.#duckdbloader.getdbconn();
		//console.log("Running command: ",cmd);
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
		const transactionid = self.crypto.randomUUID();
		await this.checkFileHandlersInSQLcmd(cmd,transactionid);
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
		await this.removeFileHandlersInSQLcmd(transactionid);
		
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
		this.#resolvesql();		
		//console.log("Completed command: ",cmd,res);	
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
				const transactionid = self.crypto.randomUUID();
				await this.checkFileHandlersInSQLcmd(cmdarr[i].scriptCode,transactionid);
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
				await this.removeFileHandlersInSQLcmd(transactionid);
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
	async checkFileHandlersInSQLcmd(inputString,transactionid) {
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
					await this.#fileiohandler.checkDuckdbHandleForFileName(match[2],transactionid);
				} else if (match[3] !== undefined) {
					//matches.push(match[3]); // For $$
					await this.#fileiohandler.checkDuckdbHandleForFileName(match[3],transactionid);
				}
			}
		} catch (err) {
			console.error('Error processing file names/handle in sql.');
		}
		
		return true;
	}

	// ------------------------------------------------------------------------------
	//
	async removeFileHandlersInSQLcmd(transactionid) {
		await this.#fileiohandler.clearDuckDbFileHandles(transactionid);
	}
	// ------------------------------------------------------------------------------
	
	extractPyError(err) {
		let res = {};
		const errarr = err?.message?.split("\n").filter(e=>e.length>0);
		let pyerrmessageshort = "";
		let pyerrorline = "";
		let lastline = 0;
		let linewithexec = 0;
		const re = /line (\d+)/gi;
		for (let i=0;i<errarr?.length;i++) {
			const matcharr = errarr[i].match(re);
			if (matcharr!==null && matcharr.length>0) {
				lastline = i;
				if (errarr[i].includes('<exec>')) {
					linewithexec = i;
					pyerrorline = matcharr[0].replace("line ","");
				}
			}
		}
		if (lastline===linewithexec && (lastline+1)<errarr?.length) {
			lastline++;
		}
		for (let i=lastline;i<errarr?.length;i++) {
			pyerrmessageshort+=errarr[i]+'\n';
		}
		if (pyerrmessageshort === "") {
			pyerrmessageshort = err?.message?.toString();
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
		const get_plotly_html_cmd = `import plotly
plotly.io.to_html(fig,config={'scrollZoom': True, 'responsive': True, 'toImageButtonOptions': {
        'format': 'svg', # one of png, svg, jpeg, webp
        'filename': 'test_chart',
        'height': 500,
        'width': 700,
        'scale': 1 # Multiply title/legend/axis/canvas sizes by this factor
    }
},include_plotlyjs=False,full_html=False,default_width="100%",default_height="${elementheight}px")
`;
		if (variableVisual.targetEnv === 'py') {
			let plotlyispresent = await this.checkIfModuleIsPresentInNameSpace(variableVisual.namespaceuuid, 'plotly'); 
			let pyodideNameSpace = this.pyNameSpaces.get(variableVisual.namespaceuuid); 
			if (pyodideNameSpace) {
				try {
					if (pyodideNameSpace.has(variableVisual.varName)) {
						if (typeof pyodideNameSpace.get(variableVisual.varName) === variableVisual.varType || pyodideNameSpace.get(variableVisual.varName).type === variableVisual.varType) {
							if (variableVisual.varType==='Figure' && plotlyispresent ) {
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
	
	async nameSpaceVarExists(namespaceuuid, varName) {
		let res = false;
		let pyodide = await this.#pyodidePromise;
		let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
		
		if (pyodideNameSpace) {
			try {
				if (pyodideNameSpace.has(varName)) {
					res = true; 
				} 
			} catch (err) {  
			}
			
		}
		return res;
	}
	
	// -------------------------------------------------------------------------
	
	async checkIfModuleIsPresentInNameSpace(namespaceuuid, modulename) {
		let pyodide = await this.#pyodidePromise;
		let res = false;
		let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
		
		if (pyodideNameSpace) {

			let jsNameSpace;
			let namespacekeys;
			
			try {
				if (pyodideNameSpace.has(modulename) && pyodideNameSpace.get(modulename).type==='module') {
					return true;
				} 
			} catch (err)  {  console.warn(`Checking module ${modulename} presence error 1: `,err) }
			
			try {
				jsNameSpace = pyodideNameSpace.toJs();
				namespacekeys = [...jsNameSpace.keys()];
			} catch (err) { console.warn(`Checking module ${modulename} presence error 2: `,err) }
			
			if  (namespacekeys && jsNameSpace) {
				for (let i=0;i<namespacekeys.length;i++) {
					try {
						if (namespacekeys[i].startsWith('__')) { continue; }
						if (typeof jsNameSpace.get(namespacekeys[i]) === "object" && jsNameSpace.get(namespacekeys[i]).type === "module") {
							let moduletype = await pyodide.pyodide_py.code.eval_code_async(`${namespacekeys[i]}.__name__`, pyodideNameSpace); 
							// console.log(`Module ${namespacekeys[i]} moduletype ${moduletype}`);
							if (typeof(moduletype)==='string' && moduletype.includes(modulename)) {
								return true;
							}
						}
					} catch (err) { console.warn(`Checking module ${modulename} presence error 3: `,err) }	
					
				}
			}
		}
		return res;
	}
	
	
	// -------------------------------------------------------------------------
	
	async getNameSpaceVars(namespaceuuid) {
		
		let res = [];
		let pyodide = await this.#pyodidePromise;
		let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
		
		if (pyodideNameSpace) {
			
			
			let plotlyispresent = await this.checkIfModuleIsPresentInNameSpace(namespaceuuid, 'plotly'); 
			//~ console.log("HAS PLOTLY: ", plotlyispresent);
			//~ try {
				//~ if (pyodideNameSpace.has('plotly') && pyodideNameSpace.get('plotly').type==='module') {
					//~ plotlyispresent = true; 
				//~ } 
			//~ } catch (err)  {  }
			
			let jsNameSpace;
			let namespacekeys;
			try {
				jsNameSpace = pyodideNameSpace.toJs();
				namespacekeys = [...jsNameSpace.keys()];
			} catch (err) { console.warn("Getting namespace variables error 1: ",err) }
			
			if  (namespacekeys && jsNameSpace) {
				for (let i=0;i<namespacekeys.length;i++) {
					try {
						if (namespacekeys[i].startsWith('__')) { continue; }
						if (typeof jsNameSpace.get(namespacekeys[i]) === "string") {
							res.push({ 
								targetEnv: "py",
								namespaceuuid: namespaceuuid,
								headertext: namespacekeys[i],
								varName: namespacekeys[i],
								varType: "string"
							});
						} else if (plotlyispresent && jsNameSpace.get(namespacekeys[i]).type==='Figure') {
							res.push({ 
								targetEnv: "py",
								namespaceuuid: namespaceuuid,
								headertext: namespacekeys[i],
								varName: namespacekeys[i],
								varType: "Figure"
							});
							
						}
					} catch (err) { console.warn("Getting namespace variables error 2: ",err)  }	
					
				}
			}
			
		}
		
		return res;
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
	
	// --------------------------------------------------------------------------------------------
	async getNameSpaceVarsOfType(namespaceuuid,vartype) {
		let res = [];
		let pyodide = await this.#pyodidePromise;
		let pyodideNameSpace = this.pyNameSpaces.get(namespaceuuid); 
		
		if (pyodideNameSpace) {
			let jsNameSpace;
			let namespacekeys;
			try {
				jsNameSpace = pyodideNameSpace.toJs();
				namespacekeys = [...jsNameSpace.keys()];
			} catch (err) { console.warn("Getting namespace of type variables error 1: ",err)  }
			
			if  (namespacekeys && jsNameSpace) {
				for (let i=0;i<namespacekeys.length;i++) {
					try {
						if (namespacekeys[i].startsWith('__')) { continue; }
						if (typeof jsNameSpace.get(namespacekeys[i]) === vartype) {
							res.push({ 
								targetEnv: "py",
								namespaceuuid: namespaceuuid,
								headertext: namespacekeys[i],
								varName: namespacekeys[i],
								varType: vartype
							});
						} else if (jsNameSpace.get(namespacekeys[i]).type===vartype) {
							res.push({ 
								targetEnv: "py",
								namespaceuuid: namespaceuuid,
								headertext: namespacekeys[i],
								varName: namespacekeys[i],
								varType: vartype
							});
							
						}
					} catch (err) { console.warn("Getting namespace of type variables error 2: ",err)  }	
				}
			}	
		}
		
		return res;
	}
	
	// --------------------------------------------------------------------------------------------
	
	async runScriptStepsAndUpdateInPlace(scriptsteps, namespaceuuid) {
		
		if (!scriptsteps || scriptsteps.length===0) {
			console.log('runScriptStepsAndUpdateInPlace no script steps given!');
			return false;
		} 
		scriptsteps.sort((a,b)=>a.stepOrder-b.stepOrder);
		for (let i=0;i<scriptsteps.length;i++) {
			scriptsteps[i].lastRunStatus = null;
		}
		//console.log("scriptsteps", scriptsteps);
		
		let res;
		try {
			res = await this.runAsyncBatch(scriptsteps, namespaceuuid); 
			//console.log("Command run res: ", res);
		
			if (res?.runresults && res?.runresults.length>0) {
				for (let j=0;j<res.runresults.length;j++) {
					let stepIndex = scriptsteps.findIndex((el)=>el.stepID===res.runresults[j].stepID);
					if (stepIndex>-1) {
						scriptsteps[stepIndex].lastRunStatus = res.runresults[j].runStatus;
						scriptsteps[stepIndex].lastRunResult = res.runresults[j].runResult;
						scriptsteps[stepIndex].executionTime = res.runresults[j].executionTime;
					}
				}
				return res;
			}
			
		} catch (err) {
			console.error("Command run err ",err);
			return false;
		}
	}
	
	// --------------------------------------------------------------------------------------------
	
	async getVar(varname) {
		let res = null;
		let qryres = await this.runSQLAsync(`SELECT getvariable('${varname}') AS result;`);
		if (qryres?.runResult) {
			if (qryres?.output?.numRows>0) {
				res = qryres?.output?.get(0)['result']?.toString();
			}
		}
		return res;
	}
	// --------------------------------------------------------------------------------------------
	async setVar(varname, varval) {
		// for now assume varval is string
		let res = false;
		let qryres = await this.runSQLAsync(`SET VARIABLE ${varname} = '${varval}';`);
		if (qryres?.runResult) {
			res = true;
		}
		return res;
		
	}
	// --------------------------------------------------------------------------------------------
	async getVarList() {
		let res = [];
		const getvarscmd = `SELECT * FROM duckdb_variables();`;
		let qryres = await this.runSQLAsync(getvarscmd);
		if (qryres?.runResult) {
			if (qryres?.output?.numRows>0) {
				res = this.convertArrowToArray(qryres?.output);
			}
		}
		return res;
	}
	// --------------------------------------------------------------------------------------------
	async onVarChange(obj) {
		let res = await this.setVar(obj.id, obj.value);
		if (res) { 
			console.log("Variable changed:",obj.id, obj.value);
			this.eventbus.dispatch('InteractiveVariableChange',this,{ varname:obj.id, newvalue:obj.value } );
		};
	}
	
	// --------------------------------------------------------------------------------------------
	convertArrowToArray(res1) {
		let resArray = [];
		var DT = window.DateTime || luxon.DateTime;
		
		for (let i=0;i<res1.numRows;i++) {
			let oneline = {};
			res1.schema.fields.forEach((f)=>{
				if (Arrow.Decimal.isDecimal(f)) {
					//  DECIMAL, WITH SCALE (AFTER DEC POINT)
					if (res1.get(i)[f.name]===null) {
						oneline[f.name]=null;
					} else {
						oneline[f.name]=(+res1.get(i)[f.name].toString())/Math.pow(10,f.type.scale);
					}
				} else if (Arrow.Decimal.isDate(f)) {
					// DATE, CONVERT
					if (res1.get(i)[f.name]===null) {
						oneline[f.name]='';
					} else {
						oneline[f.name]=DT.fromJSDate(res1.get(i)[f.name]).toFormat("yyyy-MM-dd");
					}
				} else {
					oneline[f.name]=res1.get(i)[f.name];
				}	
			});
			
			resArray.push(oneline);
		}
		return resArray;
	}
	
	// --------------------------------------------------------------------------------------------
	
}


// ============

export const convertArrowToArray = (res1) => {
	let resArray = [];
	var DT = window.DateTime || luxon.DateTime;
	//const names = res1.schema.fields.map(f=>f.name);
	for (let i=0;i<res1.numRows;i++) {
		let oneline = {};
		res1.schema.fields.forEach((f)=>{
			if (Arrow.Decimal.isDecimal(f)) {
				//  DECIMAL, WITH SCALE (AFTER DEC POINT)
				if (res1.get(i)[f.name]===null) {
					oneline[f.name]=null;
				} else {
					oneline[f.name]=(+res1.get(i)[f.name].toString())/Math.pow(10,f.type.scale);
				}
			} else if (Arrow.Decimal.isDate(f)) {
				// DATE, CONVERT
				if (res1.get(i)[f.name]===null) {
					oneline[f.name]='';
				} else {
					oneline[f.name]=DT.fromJSDate(res1.get(i)[f.name]).toFormat("yyyy-MM-dd");
				}
			} else {
				oneline[f.name]=res1.get(i)[f.name];
			}	
		});
		
		// Arrow.Decimal.isDecimal(res2.schema.fields.find(e=>e.name==='m1102'))
		// Arrow.Decimal.isDecimal(window.duckdb.stroiteliarrow.schema.fields.find(e=>e.name==='v0102'))
		// Arrow.Decimal.isDate(window.duckdb.stroiteliarrow.schema.fields.find(e=>e.name==='v0102'))
		// luxon.DateTime.fromJSDate(window.duckdb.stroiteliarrow.get(0)['v0102']).toFormat("yyyy-MM-dd")
		// (+res2.get(0)['m1102'].toString())/Math.pow(10,res2.schema.fields.find(e=>e.name==='m1102').type.scale)
		//  https://arrow.apache.org/docs/js/classes/Arrow.dom.DataType.html

		resArray.push(oneline);
	}
	return resArray;
}


/*
 * 
 * type enums:
 * https://github.com/apache/arrow-js/blob/aff7891ba602a76cd2de32020940bcd820551669/src/enum.ts#L4
 * https://arrow.apache.org/docs/js/enums/Arrow.dom.Type.html#timestampnanosecond
 * 
 * r2.output.schema.fields[0].type.typeId == 10
 *     Timestamp = 10,  // Exact timestamp encoded with int64 since UNIX epoch (Default unit millisecond) 
 * 
 * r2.output.schema.fields[0].name
 * 
 * r2.output.numRows
 * r2.output.numCols
 * https://arrow.apache.org/docs/js/classes/Arrow.dom.Table.html#slice
 * r2.output.slice(0,1).get(0).d
 * r2.output.slice(0,1).toString()
 * 
 * 
 * 
 */
