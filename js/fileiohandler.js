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
		this.OPFS_DIR = this.APP_ROOT_DIR + "/opfs";
		this.USER_DIR = "/mount_dir";
		this.#duckdbloader = params.duckdbloader;
		this.#pyodideloader = params.pyodideloader;
		this.#pyodidePromise = this.#pyodideloader.pyodideReadyPromise();
		
		this.iostate = 'not_mounted';
		this.dirmountpoints = [];
		this.opfsmountpoint = {};
		this.projectfile = "";
		
		
		
		
	}
	// ------------------------------------------------------------------
	_iostatechange(newstate, addmessage='', params={}) {
		this.iostate = newstate;
		console.log(addmessage, params);
		this.eventbus.dispatch('iostatechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}
	// ------------------------------------------------------------------
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
			//~ for (let i=0;i<this.dirmountpoints.length;i++) {
				
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
				
			//~ }
			if (this.dirmountpoints.length>0) {
				// attempt to remount saved user directory		
				let dirmountsuccess = true;		
				this.dirmountpoints[0].dirPath = this.APP_ROOT_DIR + this.USER_DIR;
				
				// request user permissions for the session:
				// ------------------------------------------------
				let permissionStatus;
				try {
					let opts = {
						id: "mountdirid",
						mode: "readwrite",
					};
					permissionStatus = await this.dirmountpoints[0].dirHandle.requestPermission(opts);
				} catch (err) {
					this.eventbus.dispatch('ioError', this, { source: "init", error: err, msg: "Directory handle opening error." });
					console.error(err);
					dirmountsuccess = false;	
				}
						
				if (dirmountsuccess && permissionStatus !== "granted") {
					msg = `Readwrite access to directory ${directoryHandle?.name} not granted`;
					this.eventbus.dispatch('ioError', this, { source: "init", msg: msg, error: undefined });
					console.error(msg);
					dirmountsuccess = false;
				}
						
				
				
				// ----------------------------------------------------------------
				
				// this.dirmountpoints[0].dirHandle = directoryHandle;
				if (dirmountsuccess) {	
					try {
						this.dirmountpoints[0].mountPoint = await pyodide.mountNativeFS(this.dirmountpoints[0].dirPath, this.dirmountpoints[0].dirHandle);
					}
					catch (err) {
						msg = `Error mounting directory ${directoryHandle.name}.`;
						console.error(msg, err);
						// empty list of user dirs mounts (allowing only one dir for now)
						this.eventbus.dispatch('ioError', this, { source: "init", msg: msg, error: err });
						dirmountsuccess = false;
					}
				}
				
				if (dirmountsuccess) {
					directoriesmounted += 'Mounted local directory: "' + this.dirmountpoints[0].dirHandle.name + '" as ' + this.dirmountpoints[0].dirPath + "\n";
				} else {
					this.dirmountpoints = []; 
				}
				await this.saveBrowserState();
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
	// ------------------------------------------------------------------
	async FileIOinitialized() {
		await this.#defer;
		return true;
	}
	// ------------------------------------------------------------------
	browserSupportsDirectoryPicker() {
		return ('showDirectoryPicker' in self); 
	}
	// ------------------------------------------------------------------
	async saveBrowserState() {
		
		let dirmounts = [];
		for (let i=0; i<this.dirmountpoints.length; i++) {
			dirmounts.push(
				{
					dirHandle: this.dirmountpoints[i].dirHandle,
					mountPoint: 0,
					dirPath: this.dirmountpoints[i].dirPath
				});
		}
		
		const ioState = {
			dirmountpoints: dirmounts,
			projectfile: this.projectfile,
		};
		await set(this.KEYVAL_KEY, ioState);
		
	}
	// ------------------------------------------------------------------
	async loadBrowserState() {
		let iostate = await get(this.KEYVAL_KEY);
		if (iostate?.dirmountpoints) {
			this.dirmountpoints = [...iostate?.dirmountpoints];
		}
		this.projectfile = iostate?.projectfile;
	}
	// ------------------------------------------------------------------
	async syncFS(populate=undefined) {
		// populate == true  -->  sync direction: from FS to disk
		// populate == false -->  sync direction: from disk to FS
		// populate === undefined --> sync both ways
		/* 
		 * FS.syncfs() stores new files in OPFS correctly only if called in the order (false: disk->FS), then  (true: FS->disk)
		 * TODO:  check if this prevents overwriting existing files in OPFS (e.g. opfs timestamp> mounted timestamp
		 * TODO:  maybe delete existing opfs files before copy new?
		 * 
		 * FS.syncfs() - if called (true: FS->disk), then (false: disk->FS) for some reason does not store a new file to opfs store - needs to be researched, maybe a bug in pyodide? 
		 *
		 *   */
		
		
		let pyodide = await this.#pyodidePromise;
		let that = this;
		
		return new Promise((resolve, reject) => {
			if (populate === undefined) {
				pyodide.FS.syncfs(false, (err)=>{
						console.log('Sync FS (false: disk->FS)',err);
						pyodide.FS.syncfs(true, (err)=> { 
								console.log('Sync FS (true: FS->disk)',err);
								if (!err) {
									that.eventbus.dispatch('ioDirRefreshNeeded', that, { source: "syncFS", msg: "syncFS done" });
									resolve();
								} else {
									reject(err);
								}
						});
				});
				
			} else {
				const populatedir = populate?'FS->disk':'disk->FS';
				pyodide.FS.syncfs(populate, (err)=> { 
						console.log('Sync FS with populate:',populate,populatedir,err);
						if (!err) {
							that.eventbus.dispatch('ioDirRefreshNeeded', that, { source: "syncFS", msg: "syncFS done" });
							resolve();
						} else {
							reject(err);
						};
					});
			}
			console.log("Pyodide sync FS done");
		});
	}
	// ------------------------------------------------------------------
	async pathExists(path) {
		let pyodide = await this.#pyodidePromise;
		return pyodide.FS.analyzePath(path).exists;
	}
	// ------------------------------------------------------------------
	async opfsIsMounted() {
		return await this.pathExists(this.OPFS_DIR);
	}
	// ------------------------------------------------------------------
	async writeFileToOPFSroot(filename,arraybuf) {
		let res = true;
		let pyodide = await this.#pyodidePromise;
		await pyodide.FS.writeFile(this.OPFS_DIR+"/"+filename,arraybuf);
		return res;
	}
	// ------------------------------------------------------------------
	async readFile(path) {
		// returns a new Uint8Array buffer (encoding is binary)
		// https://emscripten.org/docs/api_reference/Filesystem-API.html#FS.readFile
		let pyodide = await this.#pyodidePromise;
		const filestat = pyodide.FS.stat(path);
		if (pyodide.FS.isFile(filestat?.mode)) {
			return pyodide.FS.readFile(path);
		}
		return undefined;
	}
	// ------------------------------------------------------------------
	/**
	 * Generates a nested array for tabulator tree output from a path of filesystem
	 * @param {string} path - path in FS, defaults to "/"
	 * @returns {Array} 	
	 */
	async genFileTreePyFS(path) {
		let pyodide = await this.#pyodidePromise;
		await this.#defer;
		let filePath = path || '/';
		
		console.log("file tree generator");
		const FSNode = pyodide.FS.analyzePath(path)?.object;
		
		const treeTraverse = (curPath,curFSNode) => {
			let fileTree = [];
			if (!curFSNode) { return fileTree; }
			if (curFSNode?.mounted && JSON.stringify(curFSNode?.contents)==='{}') {
				curFSNode = pyodide.FS.analyzePath(curPath)?.object;
			}
			//console.log(curPath,curFSNode);
			for (const key in curFSNode?.contents) {
				const node = curFSNode.contents[key];
				if (!node.isDevice) {    
					let nodeObj = {};
					nodeObj.name = node.name;
					nodeObj.path = curPath;
					nodeObj.fullpath = curPath+"/"+node.name;
					nodeObj.pick = null;
					if (!node.isFolder) {
						nodeObj.type = 'file';
						nodeObj.sizeBytes = node.usedBytes;
						// TODO:  expect new behavior in next versions of pyodide:  nodeObj.mtime (Date obj) instead of nodeObj.timestamp (missing in 0.28.0dev)
						nodeObj.timestamp = node.timestamp;
						nodeObj.modificationDate = new luxon.DateTime.fromJSDate(new Date(nodeObj.timestamp));   // .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
						
						const fileparts = node.name.split('.');
						nodeObj.filetype = fileparts[fileparts.length-1];
						
						//console.log("File", node.name, node.usedBytes, node.timestamp);
					} else {
						nodeObj.type = 'directory';
						nodeObj.filetype = ' ';
						nodeObj['_children'] = treeTraverse(nodeObj.fullpath,node);		
					}
					fileTree.push(nodeObj);
				}	
			}
			fileTree.sort((a,b)=> { 
				return (a.type+'__'+a.name).localeCompare(b.type+'__'+b.name) 
			});
			return fileTree;
		}
		
		const resTree = treeTraverse(filePath,FSNode);
		return resTree;
	}
	// ------------------------------------------------------------------
	
	async mountDirectory() {
		const opts = {
			id: "mountdirid",
			mode: "readwrite",
		};
		
		if (!this.browserSupportsDirectoryPicker) {
			const msg = "File System Access API is not supported!";
			console.error(msg);
			this.eventbus.dispatch('ioUnsupportedError', this, { source: "mountDirectory", msg: msg });
			return false;
		}
		
		let directoryHandle;
		let permissionStatus;
		let directoriesmounted = '';
		let pyodide = await this.#pyodidePromise;
		let msg = '';
		try {
			directoryHandle = await showDirectoryPicker(opts);
			permissionStatus = await directoryHandle.requestPermission(opts);
		} catch (err) {
			//  SecurityError: Failed to execute 'showDirectoryPicker' on 'Window': Must be handling a user gesture to show a file picker.
			this.eventbus.dispatch('ioError', this, { source: "mountDirectory", error: err, msg: "Directory handle opening error." });
			console.error(err);
			return false;
		}
				
		if (permissionStatus !== "granted") {
			msg = `Readwrite access to directory ${directoryHandle?.name} not granted`;
			this.eventbus.dispatch('ioError', this, { source: "mountDirectory", msg: msg, error: undefined });
			console.error(msg);
			return false;
		}
		
		if (this.dirmountpoints.length>0) {
			// check if the same dir is chosen again
			const sameentry = await directoryHandle.isSameEntry(this.dirmountpoints[0].dirHandle);
			if (sameentry) {
				msg = `Directory ${directoryHandle?.name} is already mounted as ${this.dirmountpoints[0].dirPath}`;
				this.eventbus.dispatch('ioMessage', this, { source: "mountDirectory", msg: msg, });
				console.log(msg);
				return false;
			}
			
			// unmount current directory handle
			//  !!!! TODO !!!   syncFS is not a proper promise
			await this.syncFS();
			await pyodide.FS.unmount(this.dirmountpoints[0].dirPath);
			msg = `Directory ${this.dirmountpoints[0].dirHandle.name} is unmounted.`;
			console.log(msg);
			this.eventbus.dispatch('ioMessage', this, { source: "mountDirectory", msg: msg, });
			this.dirmountpoints[0].dirHandle = undefined;
			this.dirmountpoints[0].mountPoint = undefined;
			this.dirmountpoints[0].dirPath = undefined;
			
		} else {
			this.dirmountpoints.push({dirHandle: undefined, dirPath:undefined, mountPoint:undefined  });
		}
		
		this.dirmountpoints[0].dirHandle = directoryHandle;
		this.dirmountpoints[0].dirPath = this.APP_ROOT_DIR + this.USER_DIR;
		try {
			this.dirmountpoints[0].mountPoint = await pyodide.mountNativeFS(this.dirmountpoints[0].dirPath, this.dirmountpoints[0].dirHandle);
		} catch (err) {
			msg = `Error mounting directory ${directoryHandle.name}.`;
			console.error(msg, err);
			// empty list of user dirs mounts (allowing only one dir for now)
			this.dirmountpoints = [];
			this.eventbus.dispatch('ioError', this, { source: "mountDirectory", msg: msg, error: err });
			return false;
		}
		
		
		// ----------------------------------------------------------
		//  save dir state
		await this.saveBrowserState();
		// success
		directoriesmounted += this.dirmountpoints[0].dirHandle.name + ' as ' + this.dirmountpoints[0].dirPath + "\n";	
		console.log("Mounted: " + directoriesmounted);
		this._iostatechange('dir_mount_success', 'Directory mount success!',
						{
							lengthmilli: 0,
							lengthseconds: 0,
							directoriesmounted: directoriesmounted,
						}
					);
		this.eventbus.dispatch('ioDirRefreshNeeded', this, { source: "mountDirectory", msg: "New dir mounted, refresh" });
		
		
		// -------------------
	}
	
	
}



//~ if ('showDirectoryPicker' in self) {
					//~ // The `showDirectoryPicker()` method of the File System Access API is supported.

					  //~ if (!directoryHandle) {
						//~ directoryHandle = await showDirectoryPicker(opts);
						//~ await set(directoryKey, directoryHandle);
					  //~ }
					  //~ const permissionStatus = await directoryHandle.requestPermission(opts);
					  //~ if (permissionStatus !== "granted") {
						//~ throw new Error("readwrite access to directory not granted");
					  //~ }
					  
					  //~ var { syncfsres } = await pyodide.mountNativeFS(
						//~ localmountdirpath,
						//~ directoryHandle,
					  //~ );
					  //~ window.mountdirhandle = directoryHandle;
					  //~ console.log("Mounted ", localmountdirpath, directoryHandle, syncfsres);
					  
				//~ } else {
					//~ console.error("File System Access API is not supported!");
				//~ }

				


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
