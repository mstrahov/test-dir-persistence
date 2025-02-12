/*-------
 * Local files handlers
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
	
	
	constructor(params) {
		this.#pyodidePromise = params.pyodidePromise;
		
	}
	

	async genFileTreePyFS(path) {
		let pyodide = await this.#pyodidePromise;
		let filePath = path;
		if (filePath.length===0) {
			filePath = "/";
		}
		
		console.log("file tree generator");
		const FSNode = pyodide.FS.analyzePath(path)?.object;
		
		const treeTraverse = (curPath,curFSNode) => {
			let fileTree = [];
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


