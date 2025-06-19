/*******************************
 * Pyodide module loader
 * 
 * 
 * *********************************
 */

import EventBus from "./eventbus.js";
import { ExecTimer } from "./exectimer.js"; 

export class PyodideLoader {
	#defer;
	#resolve;
	#reject;
	constructor(params) {
		
		this.eventbus = new EventBus(this);
		this.state = 'not_loaded';
		this.exectimer = new ExecTimer('Pyodide Loader Started...');
		this.pyodide = undefined;
		this.corepackeagesloaded = false;
		this.#defer = new Promise((res, rej) => {
			this.#resolve = res;
			this.#reject = rej;
		});
	}
	
	_statechange(newstate, addmessage='', params) {
		
		this.state = newstate;
		const lengthmilli = this.exectimer.timeit(`Pyodide Loader: ${newstate}`);
		const lengthseconds = this.exectimer.millitosec(lengthmilli);
		//console.log(addmessage, params);
		this.eventbus.dispatch('pyodidestatechange',this,{state:newstate, message:addmessage, lengthmilli:lengthmilli, lengthseconds: lengthseconds,  ...params } );
	}
	
	async init() {
		if (!this.pyodide) {
			try {
				this._statechange('pyodide_loading', 'Pyodide loading...');
				this.pyodide = await loadPyodide();
				// Prevent pyodide sync from deleting files in mounted directories, if files was created after mounting dir to pyodide memfs 
				// override removeRemoteEntry:    function  async function(n,o) { console.log("HACKED!",n,o); }
				this.pyodide.FS.filesystems.NATIVEFS_ASYNC.removeRemoteEntry = async function(n,o='') { console.log("Prevented deletion of file: ", o); };
				
				const pyversion = await this.pyodide.runPythonAsync(`import sys;sys.version`);
				//this.pyodide.version
				
				this._statechange('pyodide_load_success', 'Pyodide loading success!',
						{
							fullversionstring: `Running Pyodide: ${this.pyodide.version}. Python version: ${pyversion}`, 
							pyodideversion: this.pyodide.version,
							pythonversion: pyversion,
						}
					);
				await this.loadcorepackages();
				this.#resolve();			
			} catch (e) {
				console.error(e);
				this._statechange('pyodide_load_error', 'Pyodide loading failed!', e);
				this.#reject(e);
				//throw e;
			}
		}
		return this.pyodide;
	}
	
	async loadcorepackages() {
		if (!this.corepackeagesloaded) {
			try {
				this._statechange('pyodide_core_packages_loading', 'Pyodide core packages loading...');
				const pyodide = await this.init();	
				const resmicropip = await pyodide.loadPackage(["micropip","numpy","packaging","pandas", "python-dateutil", "pytz", "six"]);
				const loadingCommands = `import micropip
await micropip.install('openpyxl')
await micropip.install('sqlite3')
#await micropip.install('matplotlib')
#await micropip.install('plotly')
import sqlite3
import pandas
import openpyxl
`;
				await this.pyodide.runPythonAsync(loadingCommands);
				this._statechange('pyodide_core_packages_load_success', 'Pyodide core packages loading success!');
				this.corepackeagesloaded = true;
			} catch (e) {
				console.error(e);
				this._statechange('pyodide_core_packages_error', 'Pyodide core packages loading failed!', e);
				throw e;
			}
		}
		return true;
	}
	
	async pyodideReadyPromise() {
		await this.#defer;
		return this.pyodide;
	}
	
}


// ------------------------------------------

async function main_py() {
	let pyodide = await loadPyodide();
	//  await pyodide.loadPackage("micropip");
	let timing = window.exectimer.timeit("Py Ready!");
	output.value += "Ready! ("+timing/1000+" sec)\n";
	document.getElementById("pyrunningspinner").style.display = 'none';
	return pyodide;
}
			
			
