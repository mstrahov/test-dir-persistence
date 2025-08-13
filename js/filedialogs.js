/* *****************************
 * file dialogs
 * -----------------
 * 
 * FileUploadButton:
 * 		creates a button from params.containertemplateid template, places it to params.containerid and handles files uploaded to opfs root either by python or js opfs handle
 * 
 * FileDownLoadDialog: saves file from path to blob by URL.createObjectURL in document
 * 
 * *************************** */
import { makeCloneFromTemplate } from "./utilities.js";

export class FileUploadButton {
	#containertemplateid;
	#containerid;
	#fsHandler; 
	#internalContainer;
	#uuid;
	#defer;
	#resolve;
	#reject;
	#uploadToFilePath;
	#uploadToFileName;
	//~ #doNotSyncFS;
	
	constructor (params) {
		this.#containertemplateid = params.containertemplateid;
		this.#containerid = params.containerid;
		this.#fsHandler = params.fileSystemHandler;
		this.#uuid = self.crypto.randomUUID();
		
		this.#internalContainer = document.querySelector(this.#containerid);
		
		this.#uploadToFilePath = params.uploadToFilePath||'';
		this.#uploadToFileName = params.uploadToFileName||'';
		//~ this.#doNotSyncFS = params.doNotSyncFS||false;
		
		//~ const template = document.querySelector(this.#containertemplateid);
		//~ const clone = template.content.cloneNode(true);
		//~ clone.querySelector('#uploadfilesbutton').id = 'uploadfilesbutton'+this.#uuid;
		//~ clone.querySelector('#formFileMultiple').id = 'formFileMultiple'+this.#uuid;
		
		const clone = makeCloneFromTemplate(this.#containertemplateid, this.#uuid);
		this.#internalContainer.appendChild(clone);
		
		this.#internalContainer.querySelector('#uploadfilesbutton'+this.#uuid).addEventListener("click", this.uploadFilesButtonClick.bind(this));
		this.#internalContainer.querySelector('#formFileMultiple'+this.#uuid).addEventListener("change", this.processFiles.bind(this));
	}
	// -------------------------------------------------------------------
	async uploadFilesButtonClick() {
		this.#defer = new Promise((res, rej) => {
			this.#resolve = res;
			this.#reject = rej;
		});
		document.querySelector("#formFileMultiple"+this.#uuid).click();
		return this.#defer;
	}
	// -------------------------------------------------------------------
	async processFiles(e) {
		const files = e?.srcElement?.files;
		//~ console.log('Files chosen:',);
		if (!files) { 
			this.#reject({runStatus:false, runResult:"no selection", error: null});
			return; 
		}
		
		const root = await navigator.storage.getDirectory();
		const ismountedflag = await this.#fsHandler.opfsIsMounted();
		
		if (!this.#uploadToFilePath) {
			// default - upload to opfs root
			
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileName = file.name;
				const fileData = new Uint8Array(await file.arrayBuffer());

				if (ismountedflag) {
					// copy to OPFS root
					let res = await this.#fsHandler.writeFileToOPFSroot(fileName,fileData);
					console.log(`Written via FS, file: ${fileName}, ${res}`);
					
				} else {
					// Create a new file in the OPFS root directory
					const fileHandle = await root.getFileHandle(fileName, { create: true });
					const writable = await fileHandle.createWritable();
					await writable.write(fileData);
					await writable.close();
				}
				console.log(`Copied file: ${fileName}`);
			}
			if (ismountedflag) { await this.#fsHandler.syncFS(); } 
		} else {
			// upload to this.#uploadToFilePath
			// *****************
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				let fileName = file.name;
				const fileData = new Uint8Array(await file.arrayBuffer());

				if (this.#uploadToFileName) { fileName = this.#uploadToFileName; }
				let res = await this.#fsHandler.writeFileToPath(this.#uploadToFilePath,fileName,fileData);
				
				console.log(`Copied file: ${file.name} as ${fileName} to ${this.#uploadToFilePath}`);
			}
			
			
			// ******************
			
		}
		this.#resolve({runStatus:true, runResult:"success", error: null});
	}
	// -------------------------------------------------------------------
}
	
	
//  SAVE A FILE AS  https://web.dev/patterns/files/save-a-file/
// ********************************************************************************************************
export class FileDownLoadDialog {
	#fsHandler;
	#uuid;
	
	constructor (params)	{
		this.#fsHandler = params.fileSystemHandler;
		this.#uuid = self.crypto.randomUUID();
	}
	
	async downloadFromFSPath(path) {
		const pathparts = path.split("/");
		const suggestedName = pathparts[pathparts.length-1];
		
		const blob = await this.#fsHandler.readFile(path);
		if (blob) {
			await this.saveFileFromBlob(new Blob([blob], { type: 'application/octet-stream' }), suggestedName);
		} else {
			console.error('Cannot save or not a file', path);
		}
	}
	
	async saveFileFromBlob(blob, suggestedName) {
	  const supportsFileSystemAccess =
		'showSaveFilePicker' in window &&
		(() => {
		  try {
			return window.self === window.top;
		  } catch {
			return false;
		  }
		})();
	  if (supportsFileSystemAccess) {
		try {
		  const handle = await showSaveFilePicker({
			suggestedName,
		  });
		  const writable = await handle.createWritable();
		  await writable.write(blob);
		  await writable.close();
		  return;
		} catch (err) {
		  if (err.name !== 'AbortError') {
			console.error(err.name, err.message);        
		  }
		  return;
		}
	  }
	  // Fallback if the File System Access API is not supported…
	  const blobURL = URL.createObjectURL(blob);
	  const a = document.createElement('a');
	  a.href = blobURL;
	  a.download = suggestedName;
	  a.style.display = 'none';
	  document.body.append(a);
	  a.click();
	  setTimeout(() => {
		URL.revokeObjectURL(blobURL);
		a.remove();
	  }, 10000);
	}
	
}
