/* *****************************
 * file dialogs
 * 
 * 
 * *************************** */

export class FileUploadButton {
	#containertemplateid;
	#containerid;
	#fsHandler; 
	#internalContainer;
	#uuid;
	
	constructor (params) {
		this.#containertemplateid = params.containertemplateid;
		this.#containerid = params.containerid;
		this.#fsHandler = params.fileSystemHandler;
		this.#uuid = self.crypto.randomUUID();
		
		this.#internalContainer = document.querySelector(this.#containerid);
		const template = document.querySelector(this.#containertemplateid);
		const clone = template.content.cloneNode(true);
		clone.querySelector('#uploadfilesbutton').id = 'uploadfilesbutton'+this.#uuid;
		clone.querySelector('#formFileMultiple').id = 'formFileMultiple'+this.#uuid;
		this.#internalContainer.appendChild(clone);
		
		this.#internalContainer.querySelector('#uploadfilesbutton'+this.#uuid).addEventListener("click", this.uploadFilesButtonClick.bind(this));
		this.#internalContainer.querySelector('#formFileMultiple'+this.#uuid).addEventListener("change", this.processFiles.bind(this));
	}
	
	uploadFilesButtonClick() {
		document.querySelector("#formFileMultiple"+this.#uuid).click();
	}
	
	async processFiles(e) {
		const files = e?.srcElement?.files;
		console.log('Files chosen:',);
		if (!files) { return; }
		const root = await navigator.storage.getDirectory();
		
		const ismountedflag = await this.#fsHandler.opfsIsMounted();
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
		
	}
	
}
	
	
	
