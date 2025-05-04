/* 
 * File and directory handlers
 * 
 * depends on:
 * https://github.com/jakearchibald/idb-keyval#readme
 * 
 * */
import EventBus from "./eventbus.js";
const { get, set } = await import(
		  // "https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js"
		  'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm'
		);

export class FileIOHandler {
	#duckdbloader;
	#pyodideloader; 
    #pyodidePromise;
    #defer;
	#resolve;
	#reject;
    
	constructor(params) {
		this.#defer = new Promise((res, rej) => {
			this.#resolve = res;
			this.#reject = rej;
		});
		
		this.eventbus = new EventBus();
		this.KEYVAL_KEY = "fileiostatekey";
		this.APP_ROOT_DIR = "/app";
		this.OPFS_DIR = "/app/opfs";
		this.USER_DIR = "/mount_dir";
		this.#duckdbloader = params.duckdbloader;
		this.#pyodideloader = params.pyodideloader;
		this.#pyodidePromise = this.#pyodideloader.pyodideReadyPromise();
		
		this.iostate = 'not_mounted';
		this.dirmountpoints = [];
		this.opfsmountpoint = {};
		this.projectfile = "";
		
		
		
		
	}

	_iostatechange(newstate, addmessage='', params={}) {
		this.iostate = newstate;
		console.log(addmessage, params);
		this.eventbus.dispatch('iostatechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}

	async init() {
		let pyodide = await this.#pyodidePromise;
		let directoriesmounted = '';
		const starttime = performance.now();   
		this._iostatechange('files_io_initializing', 'Initializing mounted directories...');
		await this.loadBrowserState();
		
		// load opfs
		await pyodide.FS.mkdir(this.APP_ROOT_DIR);
		await pyodide.FS.mkdir(this.OPFS_DIR);
		this.opfsmountpoint.dirHandle = await navigator.storage.getDirectory();
		this.opfsmountpoint.dirPath = this.OPFS_DIR;	
		this.opfsmountpoint.mountPoint = await pyodide.mountNativeFS(this.opfsmountpoint.dirPath, this.opfsmountpoint.dirHandle);
		console.log("Mounted OPFS: ", this.opfsmountpoint);
		directoriesmounted+='OPFS root as ' + this.opfsmountpoint.dirPath + "\n";		
		
		if (this.browserSupportsDirectoryPicker() && this.dirmountpoints) {
			for (let i=0;i<this.dirmountpoints.length;i++) {
				
				//~ let localmountdirpath = this.APP_ROOT_DIR + this.USER_DIR + i===0?'':i;
				//~ await pyodide.FS.mkdir(localmountdirpath);
				
				 //~ const permissionStatus = await directoryHandle.requestPermission(opts);
					  //~ if (permissionStatus !== "granted") {
						//~ throw new Error("readwrite access to directory not granted");
					  //~ }
					  
					  //~ var { syncfsres } = await pyodide.mountNativeFS(
						//~ localmountdirpath,
						//~ directoryHandle,
					  //~ );
				
			}
		}
		
		
		//  error:  this.#reject(e);
		
		let lengthmilli = performance.now() - starttime;
		let lengthseconds = lengthmilli / 1000;
		// let executionTime = Math.round(res.lengthmilli)/1000;
		this._iostatechange('files_io_init_success', 'Directories mount success!',
						{
							lengthmilli: lengthmilli,
							lengthseconds: lengthseconds/1000,
							directoriesmounted: directoriesmounted,
						}
					);
					
		this.#resolve();
		return true;
	}

	async FileIOinitialized() {
		await this.#defer;
		return true;
	}

	browserSupportsDirectoryPicker() {
		return ('showDirectoryPicker' in self); 
	}
	
	async saveBrowserState() {
		const ioState = {
			dirmountpoints: [...this.dirmountpoints],
			projectfile: this.projectfile,
		};
		await set(this.KEYVAL_KEY, ioState);
		
	}
	
	async loadBrowserState() {
		let iostate = await get(this.KEYVAL_KEY);
		if (iostate?.dirmountpoints) {
			this.dirmountpoints = [...iostate?.dirmountpoints];
		}
		this.projectfile = iostate?.projectfile;
	}
	
}






/*
 * 
 * 
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
 * 
 * 
 * https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts
 *  const opfsRoot = await navigator.storage.getDirectory();
            const testHandle = await opfsRoot.getFileHandle('test.csv', {create: true});
         
         
     list all file handles
     * await window.duckdb.db.globFiles()
     * 
     
		[ {cacheEpoch: 3, fileId: 7, fileName: 'opfs://test.parquet', fileSize: 436, dataProtocol: 3, …}     ]
        
	await window.duckdb.db.registerFileHandle('test.csv', testHandle, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true);


	const datadir = await opfsRoot.getDirectoryHandle('datadir');
	await opfsRoot.removeEntry('test3.csv')
	* 
	await window.duckdb.db.dropFiles()

	COPY (SELECT * FROM tbl) TO 'output.parquet' (FORMAT parquet);

*/
