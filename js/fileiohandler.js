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
		this.TEMP_DIR = this.APP_ROOT_DIR + "/temp";
		this.#duckdbloader = params.duckdbloader;
		this.#pyodideloader = params.pyodideloader;
		this.#pyodidePromise = this.#pyodideloader.pyodideReadyPromise();
		
		this.iostate = 'not_mounted';
		this.dirmountpoints = [];
		this.opfsmountpoint = {};
		this.projectfile = "";
		this.duckdbfilehandles = [];
		
	}
	// ------------------------------------------------------------------
	
	async getduckdbloader() {
		return await this.#duckdbloader;
	}
	
	// ------------------------------------------------------------------
	_iostatechange(newstate, addmessage='', params={}) {
		this.iostate = newstate;
		console.log(addmessage, params);
		this.eventbus.dispatch('iostatechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}
	
	// ------------------------------------------------------------------
	
	_ioerrormessage(error, addmessage='', params={} ) {
		console.error(error, addmessage, params);
		this.eventbus.dispatch('ioError', this, { source: "ioerrormessage", error: error, msg: addmessage, ...params });
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
		await pyodide.FS.mkdir(this.TEMP_DIR); 
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
		
		
		// Prevent pyodide sync from deleting files in mounted directories, if files was created after mounting dir to pyodide memfs 
		// override removeRemoteEntry:    function  async function(n,o) { console.log("HACKED!",n,o); }
		pyodide.FS.filesystems.NATIVEFS_ASYNC.removeRemoteEntry = async function(n,o='') { console.log("Prevented deletion of file: ", o); };
		
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
		 * https://github.com/pyodide/pyodide/blob/main/src/js/nativefs.ts#L199
		 *   */
		
		let pyodide = await this.#pyodidePromise;
		await this.#defer;
		let that = this;
		this.#defer = new Promise((res, rej) => {
			this.#resolve = res;
			this.#reject = rej;
		});
		
		return new Promise((resolve, reject) => {
			if (populate === undefined) {
				pyodide.FS.syncfs(false, (err)=>{
						console.log('Sync FS (false: disk->FS)',err);
						pyodide.FS.syncfs(true, (err)=> { 
								console.log('Sync FS (true: FS->disk)',err);
								if (!err) {
									that.eventbus.dispatch('ioDirRefreshNeeded', that, { source: "syncFS", msg: "syncFS done" });
									this.#resolve();
									resolve();
									
								} else {
									this.#reject();
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
							this.#resolve();
							resolve();
						} else {
							this.#reject();
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
		await this.#defer;
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
		await this.#defer;
		await pyodide.FS.writeFile(this.OPFS_DIR+"/"+filename,arraybuf);
		return res;
	}
	// ------------------------------------------------------------------
	async writeFileToPath(filepath,filename,arraybuf) {
		let res = true;
		let pyodide = await this.#pyodidePromise;
		await this.#defer;
		
		filepath = filepath.trim();
		if (filepath.endsWith('/')) { filepath = filepath.slice(0,-1); }
		if (!this.pathExists(filepath)) {
			throw(new Error('File path does not exist!'));
			return false;
		}
		await pyodide.FS.writeFile(filepath+"/"+filename,arraybuf);
		
		return res;
	}
	// ------------------------------------------------------------------
	async readFile(path) {
		// returns a new Uint8Array buffer (encoding is binary)
		// https://emscripten.org/docs/api_reference/Filesystem-API.html#FS.readFile
		let pyodide = await this.#pyodidePromise;
		await this.#defer;
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
						if (nodeObj.fullpath === (this.APP_ROOT_DIR+this.USER_DIR) && this.dirmountpoints.length>0) {
							nodeObj.name += ' (' + this.dirmountpoints[0]?.dirHandle?.name + ')';
						}
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
	
	async openDirectoryHandleFromDialog(mode="readwrite") {
		let directoryHandle;
		
		const opts = {
			mode: mode,
		};
	
		if (!this.browserSupportsDirectoryPicker) {
			const msg = "File System Access API is not supported!";
			console.error(msg);
			this.eventbus.dispatch('ioUnsupportedError', this, { source: "mountDirectory", msg: msg });
			return false;
		}
		
		let permissionStatus;
		let msg = '';
		try {
			directoryHandle = await showDirectoryPicker(opts);
			permissionStatus = await directoryHandle.requestPermission(opts);
		} catch (err) {
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
	
		return directoryHandle;
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
		await this.#defer;
		
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
	
	
	async createDuckdbFileHandle(filenamestr, filehandle, filesource='', transactionid='') {
		// must be files in the form "/app/*"
		// this.duckdbfilehandles
		// window.duckdb.db.registerFileHandle('/app/opfs/onlineretail.csv', fileHandle, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true)
		// let h1 = await window.duckdb.db.registerFileHandle('/app/mount_dir/onlineretail.csv', await window.testfilehandle.getFile(), window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true)

		//~ if (this.duckdbFileHandleExists(filenamestr)) {
			//~ return true;
		//~ }
		
		await this.FileIOinitialized();
		await this.#duckdbloader.getdbconn();
		let pyodide = await this.#pyodidePromise;
		
		await this.duckdbRemoveFileHandleFromList(filenamestr);

		
		if (filesource===this.APP_ROOT_DIR+this.USER_DIR) {
			// currently only opfs and memfs? are supported by duckdb for sync access to filehandles, mounted dir works only in read-only mode via filehandle.getFile()
			try {
				await this.#duckdbloader.db.registerFileHandle(filenamestr, await filehandle.getFile(), this.#duckdbloader.duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
				this.duckdbfilehandles.push({filename: filenamestr, transactionid:transactionid});
			} catch (err) {
				console.error('Error registering duckdb file handle ',filenamestr, filehandle, err);
				return false;
			}
		}  else if (filesource===this.OPFS_DIR) {
			// for opfs/ memory attempt to open read-write handle  this.OPFS_DIR
			try {
				await this.#duckdbloader.db.registerFileHandle(filenamestr, filehandle, this.#duckdbloader.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true);
				this.duckdbfilehandles.push({filename: filenamestr, transactionid:transactionid});
			} catch (err) {
				console.error('Error registering duckdb file handle ',filenamestr, filehandle, err);
				return false;
			}
		} else  {
			// temporary in-memory file handle, register as a Uint8Array buffer
			try {
				//await this.#duckdbloader.db.registerFileHandle(filenamestr, filehandle, this.#duckdbloader.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true);
				
				const fileinfo = pyodide.FS.analyzePath(filenamestr);
				
				if (fileinfo.exists===true && (fileinfo.object?.isFolder || fileinfo.object.isDevice)) {
					console.error('Cannot register temp duckdb file handle, path exists, but not a file. ',filenamestr, filehandle);
					return false;
				}
				
				let buffer;
				if (fileinfo.exists===true) {
					buffer = await pyodide.FS.readFile(filenamestr);	
					await this.#duckdbloader.db.registerFileBuffer(filenamestr, buffer);	
				} else {
					buffer = new Uint8Array();		
					if (!this.#duckdbloader.duckdb.isFirefox()) {
						await this.#duckdbloader.db.registerFileBuffer(filenamestr, buffer);
					}		
				}
				//await this.#duckdbloader.db.registerFileBuffer(filenamestr, buffer);	
				this.duckdbfilehandles.push({filename: filenamestr, transactionid:transactionid, buffer: buffer});
				
				
			} catch (err) {
				console.error('Error registering temp duckdb file handle ',filenamestr, filehandle, err);
				return false;
			}
		}
		
		
		
		
		
		return true;
	}
	
	// ----------------------------------------------
	
	duckdbFileHandleExists(filenamestr) {
		return this.duckdbfilehandles.findIndex((el)=>el.filename===filenamestr)>-1;
	}
	// ----------------------------------------------
	
	
	
	async duckdbRemoveFileHandleFromList(filenamestr) {
		// {filename: filenamestr, transactionid:transactionid, buffer: buffer}
		await this.FileIOinitialized();
		await this.#duckdbloader.getdbconn();
		let pyodide = await this.#pyodidePromise;
		
		let ind = this.duckdbfilehandles.findIndex((el)=>el.filename===filenamestr);
		if (ind>-1) {
			try {
				if (this.duckdbfilehandles[ind]?.buffer) {
					// writing contents of the buffer registered for sql statement back as a file to pyodide memory FS:
					const buffer = await this.#duckdbloader.db.copyFileToBuffer(this.duckdbfilehandles[ind].filename); 
					await pyodide.FS.writeFile(this.duckdbfilehandles[ind].filename, buffer);
				}
			} catch (e) {
				console.error("Unable to write buffer as a temp file",e);
			}
			
			try {
				await this.#duckdbloader.db.dropFile(filenamestr);
				this.duckdbfilehandles.splice(ind,1);
			} catch (e) {
				console.error("Unable to remove duckdb file handle",e);
			}
		}
	}
	// ----------------------------------------------
	async clearDuckDbFileHandles(transactionid) {
	
		let ind = this.duckdbfilehandles.findIndex((el)=>el.transactionid===transactionid);
		while (ind>-1) {
			await this.duckdbRemoveFileHandleFromList(this.duckdbfilehandles[ind].filename);
			ind = this.duckdbfilehandles.findIndex((el)=>el.transactionid===transactionid);
		}
	
	}
	
	// ----------------------------------------------
	
	async findRootFileHandle(filepath) {	
		let res = { rootFH: undefined, filesource: '', relativefilename: filepath };
		await this.FileIOinitialized();
		let flname = filepath.trim();
		let rootFH = undefined;
		let filesource = '';
		
		if (flname.startsWith(this.APP_ROOT_DIR+'/')) {
			if (flname.startsWith(this.OPFS_DIR)) {
				rootFH = this.opfsmountpoint.dirHandle;
				flname = flname.replace(this.OPFS_DIR+'/','');
				filesource = this.OPFS_DIR;
			} else if (flname.startsWith(this.APP_ROOT_DIR+this.USER_DIR) && this.dirmountpoints.length>0) {
				rootFH = this.dirmountpoints[0].dirHandle;
				flname = flname.replace(this.APP_ROOT_DIR+this.USER_DIR+'/','');
				filesource = this.APP_ROOT_DIR+this.USER_DIR;
			} else {
				filesource = this.APP_ROOT_DIR;
				flname = flname.replace(this.APP_ROOT_DIR+'/','');
			}
		}
		
		if (flname===this.OPFS_DIR || flname===(this.APP_ROOT_DIR+this.USER_DIR)) {
			flname = '';
		}
		
		res.rootFH = rootFH;
		res.filesource = filesource;
		res.relativefilename = flname;
		return res;
	}
	
	// ----------------------------------------------
	
	async findOrCreateFileHandleByFilePath(filename, rootFH) {
		let filehandle = undefined;
		await this.FileIOinitialized();
		let flname = filename.trim();
				
		let curdirhandle = rootFH;
		if (!curdirhandle) {
			const rootFileHandle = await this.findRootFileHandle(flname);
			curdirhandle = rootFileHandle.rootFH; 
			flname = rootFileHandle.relativefilename;
		}
		
		if (!curdirhandle) {
			console.error(`Error getting root file handle for ${flname}`);
			return undefined;
		}
		if (flname.endsWith("/")) {
			flname = flname.substring(0,flname.length-1);
		}
		
		let filepath = flname.split('/');
		for (let i=0;i<filepath.length;i++) {
			if (filepath[i]?.length>0) {
				if (i<(filepath.length-1)) {
					try {
						curdirhandle = await curdirhandle.getDirectoryHandle(filepath[i], { create: true });
					} catch (err) {
						console.error('Error getting dir handle for ', filepath[i], err);
						break;
					};
				} else {
					try {
						filehandle = await curdirhandle.getFileHandle(filepath[i], { create: true });
						//window.testfilehandle = filehandle;
					} catch (err) {
						console.error('Error getting file handle for ', filepath[i], err);
					}
				}		
			}
		}
	
		return filehandle;
	}
	// ----------------------------------------------
	
	async findOrCreateDirectoryHandleByFilePath(filename, rootFH) {
		let filehandle = undefined;
		await this.FileIOinitialized();
		let flname = filename.trim();
		
		let curdirhandle = rootFH;
		if (!curdirhandle) {
			const rootFileHandle = await this.findRootFileHandle(flname);
			curdirhandle = rootFileHandle.rootFH; 
			flname = rootFileHandle.relativefilename;
		}
		
		if (!curdirhandle) {
			console.error(`Error getting root file handle for ${flname}`);
			return undefined;
		}
		if (flname.endsWith("/")) {
			flname = flname.substring(0,flname.length-1);
		}
		
		if (flname==='') {
			filehandle = curdirhandle;
		} else {
			let filepath = flname.split('/');
			for (let i=0;i<filepath.length;i++) {
				if (filepath[i]?.length>0) {
					if (i<(filepath.length-1)) {
						try {
							curdirhandle = await curdirhandle.getDirectoryHandle(filepath[i], { create: true });
						} catch (err) {
							console.error('Error getting dir handle for ', filepath[i], err);
							break;
						};
					} else {
						try {
							filehandle = await curdirhandle.getDirectoryHandle(filepath[i], { create: true });
							//window.testfilehandle = filehandle;
						} catch (err) {
							console.error('Error getting directory handle for ', filepath[i], err);
						}
					}		
				}
			}
		}
		return filehandle;
	}
	
	// ----------------------------------------------
	async checkDuckdbHandleForFileName(filenamestr, transactionid) {
		// trying to automatically create duckdb file handles for every filename like '/app/*/*'
		// TODO: handle directory change when different is mounted to /app/mount_dir.  delete duckdb file handles?
		
		//~ if (this.duckdbFileHandleExists(filenamestr)) {
			//~ return true;
		//~ }
		
		let flname = filenamestr.trim();
		await this.FileIOinitialized();
		// *****
		//~ let rootFH = undefined;
		//~ let filesource = '';
		//~ if (flname.startsWith(this.APP_ROOT_DIR+'/')) {
			//~ if (flname.startsWith(this.OPFS_DIR+'/')) {
				//~ rootFH = this.opfsmountpoint.dirHandle;
				//~ flname = flname.replace(this.OPFS_DIR+'/','');
				//~ filesource = this.OPFS_DIR;
			//~ } else if (flname.startsWith(this.APP_ROOT_DIR+this.USER_DIR+'/') && this.dirmountpoints.length>0) {
				//~ rootFH = this.dirmountpoints[0].dirHandle;
				//~ flname = flname.replace(this.APP_ROOT_DIR+this.USER_DIR+'/','');
				//~ filesource = this.APP_ROOT_DIR+this.USER_DIR;
			//~ } else {
				//~ filesource = this.APP_ROOT_DIR;
			//~ }
			
		//~ }
		// *****
		const rootFileHandle = await this.findRootFileHandle(flname);
		let rootFH = rootFileHandle.rootFH;
		let filesource = rootFileHandle.filesource;
		flname = rootFileHandle.relativefilename;
		// *****
		
		if (!rootFH) {
			// file is not in a mounted file system, memory only
			if (filesource === this.APP_ROOT_DIR) {
				await this.createDuckdbFileHandle(filenamestr, null, filesource, transactionid);
				return true;
			} else {
				return false;
			}
		}
		
		//  file is in a mounted file system folder, trying to find a file handle
		// *********
		//~ let filepath = flname.split('/');
		//~ let filehandle = undefined;
		//~ let curdirhandle = rootFH;
		//~ for (let i=0;i<filepath.length;i++) {
			//~ if (filepath[i]?.length>0) {
				//~ if (i<(filepath.length-1)) {
					//~ try {
						//~ curdirhandle = await curdirhandle.getDirectoryHandle(filepath[i], { create: true });
					//~ } catch (err) {
						//~ console.error('Error getting dir handle for ', filepath[i], err);
						//~ break;
					//~ };
				//~ } else {
					//~ try {
						//~ filehandle = await curdirhandle.getFileHandle(filepath[i], { create: true });
						//~ window.testfilehandle = filehandle;
					//~ } catch (err) {
						//~ console.error('Error getting file handle for ', filepath[i], err);
					//~ }
				//~ }		
			//~ }
		//~ }
		// *********
		let filehandle = await this.findOrCreateFileHandleByFilePath(flname, rootFH);
		
		// *****
		if (!filehandle) {
			return false;
		}
		await this.createDuckdbFileHandle(filenamestr,filehandle,filesource, transactionid);
		return true;
	}
	
	// ----------------------------------------------
	
	async backupExistingFileInPlace(filepath) {
		let res = false;
		
		let fh = await window.fileiohandler.findOrCreateFileHandleByFilePath(filepath);
		if (!fh) {
			this._ioerrormessage(null, `Error getting file handle for ${filepath}`, {} ); 
			return res;
		}
		
		let bkFileNameAddition = (new Date).toISOString().replaceAll('-','').replaceAll(':','').replaceAll('.','');
		const nameparts = fh.name.split(".");
		let newFileName = fh.name.replace(nameparts[0],nameparts[0]+bkFileNameAddition);  
		let pathparts = filepath.split('/');
		pathparts[pathparts.length-1]=newFileName;
		let newFilePath = pathparts.join('/');
		
		let fhdest = await window.fileiohandler.findOrCreateFileHandleByFilePath(newFilePath);
		if (!fhdest) {
			this._ioerrormessage(null, `Error getting backup destination file handle: ${newFilePath}`, {} ); 
			return res;
		}
		
		try {
			const buffer = await fh.getFile();
			const writable = await fhdest.createWritable();
			await writable.write(buffer);
			await writable.close();	
			res = true;		
		} catch (err) {
			this._ioerrormessage(err, `Error copying file from ${filepath} to ${newFilePath}`, {} ); 
		}
		
		return res;
	}
	
	
	// ----------------------------------------------
	async deleteFileFromFSandFileHandle(filepath) {
		
		let pyodide = await this.#pyodidePromise;
		
		let dirPath = filepath;
		const spl = dirPath.split('/');
		if (spl.length>0) {
			dirPath = dirPath.substring(0,dirPath.length-spl[spl.length-1].length);
		} 
		if (dirPath.endsWith('/')) { dirPath = dirPath.substring(0,dirPath.length-1); }
	
		try {
			let dirhandle = await this.findOrCreateDirectoryHandleByFilePath(dirPath);
			if (dirhandle) {
				await dirhandle.removeEntry(spl[spl.length-1]);
			} else {
				this._ioerrormessage(null, `Error deleting file ${filepath} from file system, directory handle not found!`, {} ); 
			}
			if (pyodide.FS.analyzePath(filepath)?.exists) {
				await pyodide.FS.unlink(filepath);
			}
		} catch (err) {
			this._ioerrormessage(err, `Error deleting file ${filepath}`, {} ); 
			return false;
		}
		
		return true;
	
	}
	// ----------------------------------------------
	async deleteFileFromFS(filepath) {
		
		let pyodide = await this.#pyodidePromise;
		
		let dirPath = filepath;
		const spl = dirPath.split('/');
		if (spl.length>0) {
			dirPath = dirPath.substring(0,dirPath.length-spl[spl.length-1].length);
		} 
		if (dirPath.endsWith('/')) { dirPath = dirPath.substring(0,dirPath.length-1); }
	
		try {
			if (pyodide.FS.analyzePath(filepath)?.exists) {
				await pyodide.FS.unlink(filepath);
			}
		} catch (err) {
			this._ioerrormessage(err, `Error deleting file from FS ${filepath}`, {} ); 
			return false;
		}
		
		return true;
	
	}
	// ----------------------------------------------
	
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
