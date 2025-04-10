/*******************
 * async Python and duckdb code runner
 * 
 *
 * 
 * 
 * ****************************/
import EventBus from "./eventbus.js";
import { ExecTimer } from "./exectimer.js"; 

export class CodeRunner {
	#pyodidePromise;
	#dbconnPromise;
	#duckdbloader;
	#pyodideloader;
	
	constructor (params) {
		this.eventbus = new EventBus(this);
		this.#pyodidePromise = params.pyodidePromise;
		this.#dbconnPromise = params.dbconnPromise;
		this.#duckdbloader = params.duckdbloader;
		this.#pyodideloader = params.pyodideloader;
		
		this.pystate = 'not_running';
		this.dbstate = 'not_running';
		//this.exectimer = new ExecTimer('Pyodide Loader Started...');
		
		this.cmdhistory = [];
	}
	
	async initPy() {
	}
	
	async initSQL() {
	}
	
	_pystatechange(newstate, addmessage='', params) {
		this.pystate = newstate;
		//const lengthmilli = this.exectimer.timeit(`Pyodide Loader: ${newstate}`);
		//const lengthseconds = this.exectimer.millitosec(lengthmilli);
		console.log(addmessage, params);
		this.eventbus.dispatch('pyodidestatechange',this,{state:newstate, message:addmessage, lengthmilli:params.lengthmilli||0, lengthseconds: params.lengthseconds||0,  ...params } );
	}
	
	_dbstatechange(newstate, addmessage='', params) {
		this.dbstate = newstate;
		//const lengthmilli = this.exectimer.timeit(`Pyodide Loader: ${newstate}`);
		//const lengthseconds = this.exectimer.millitosec(lengthmilli);
		console.log(addmessage, params);
		this.eventbus.dispatch('dbstatechange',this,{state:newstate, message:addmessage, lengthmilli:params.lengthmilli||0, lengthseconds: params.lengthseconds||0,  ...params } );
	}
	
	
	async getNewPythonNameSpace(appuuid) {
		let pyodide = await this.#pyodideloader.pyodideReadyPromise();
	
	}

	async runAsync(targetEnv, cmd, appuuid="global", namespace="global") {
		if (targetEnv=="py") {
			return await runPythonAsync(cmd,appuuid,namespace);
		} else if (targetEnv=="sql") {
			return await runSQLAsync(cmd,appuuid,namespace);
		} else {
			const err_msg = 'Coderunner.runAsync: Wrong targetenv (should be py or sql) in command.';
			console.error(err_msg,cmd,appuuid,namespace)
			throw new Error(err_msg);
		}
		
	}
	
	async runPythonAsync(cmd, appuuid="global", namespace="global") {
		const starttime = performance.now();   
		this._pystatechange('pyodide_running', 'Running python script...');
		
		let res = {
			output: null,
			runStatus: undefined,
			runResult: "",
			error: null,
			shorterror: null,
			lengthmilli: 0,
			lengthseconds: 0,
			executionTime: 0,
		}
		
		try {
			res.output = await pyodide.runPythonAsync(cmd);
			res.runStatus = true;
			res.runResult = "success";
			//console.log(res.output);      //  res.output.toJs()  
		} catch (err) {
			
		}
		
		res.lengthmilli = performance.now() - starttime;
		res.lengthseconds = res.lengthmilli / 1000;
		res.executionTime = Math.round(res.lengthmilli)/1000;
		this._pystatechange('pyodide_run_success', 'Python run success!',
						{
							lengthmilli: res.lengthmilli,
							lengthseconds: res.lengthseconds/1000,
						}
					);
		
		return res;
	}
	
	async runSQLAsync(cmd, appuuid="global", namespace="global") {
		let conn = await this.#duckdbloader.getdbconn();
		
	}
	
	async runAsyncBatch(cmdarr, appuuid="global", namespace="global") {
		// cmdarr of type {	targetEnv: "py", scriptCode: "", stepOrder: 0,}
		// then execute all returning last statement, show spinner for the whole run
		
	}
	
	
}
