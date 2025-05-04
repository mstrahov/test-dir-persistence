/*-------
 * Local files handlers
 * 
 * export class FileSystemHandler
 * window.localFileHandler = new FileSystemHandler({pyodidePromise: window.pyodideReadyPromise});
 * 
 * 
 * 
 * ---------------*/

//  using FileSystemDirectoryHandle 
let trav = async () => {
    const contents = await window.mountdirhandle.entries();
    for await (const [key,entry] of contents) {
        console.log(entry);
        if (entry.kind=='file') {
            const file = await entry.getFile();   //  FileSystemFileHandle
            console.log(file.name,file.size,file.lastModifiedDate,file.type);
        } else if (entry.kind=='directory') {
            console.log('dir detected');
        }
    }
}



//  using pyodide.FS
let pytrav = async (path) => {
	
	let pyodide = await window.pyodideReadyPromise;
	const FSNode = pyodide.FS.analyzePath(path)?.object;
	for (const key in FSNode?.contents) {
        const node = FSNode.contents[key];
		if (!node.isDevice) {
			if (!node.isFolder) {
				console.log(node);
				console.log("File", node.name, node.usedBytes, node.timestamp);
			} else {
				// directory
				console.log("Directory", node.name);
			}
		}	
	}
}


export class FileSystemHandler {
	#pyodidePromise;
	#pyodide;
	#approot;
	#opfspath;
	
	constructor(params) {
		this.#pyodidePromise = params.pyodidePromise;
		this.#approot = '/app';
		this.#opfspath = this.#approot+'/opfs';
	}
	
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
		if (populate === undefined) {
			pyodide.FS.syncfs(false, (err)=>{
					console.log('Sync FS (false: disk->FS)',err);
					pyodide.FS.syncfs(true, (err)=>console.log('Sync FS (true: FS->disk)',err));
			});
			
		} else {
			const populatedir = populate?'FS->disk':'disk->FS';
			pyodide.FS.syncfs(populate, (err)=>console.log('Sync FS with populate:',populate,populatedir,err));
		}
		console.log("Pyodide sync FS done");
	}
	
	async pathExists(path) {
		let pyodide = await this.#pyodidePromise;
		return pyodide.FS.analyzePath(path).exists;
	}
	
	async opfsIsMounted() {
		return await this.pathExists(this.#opfspath);
	}
	
	async writeFileToOPFSroot(filename,arraybuf) {
		let res = true;
		let pyodide = await this.#pyodidePromise;
		await pyodide.FS.writeFile(this.#opfspath+"/"+filename,arraybuf);
		return res;
	}
	
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
	
	/**
	 * Generates a nested array for tabulator tree output from a path of filesystem
	 * @param {string} path - path in FS, defaults to "/"
	 * @returns {Array} 	
	 */
	async genFileTreePyFS(path) {
		let pyodide = await this.#pyodidePromise;
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
	
	
}


