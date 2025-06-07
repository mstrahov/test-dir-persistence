/*******************
 * Status view - updates spinner and py/db/persistent store icon statuses
 * 
 * 
 * 
 * ****************************/

import { makeCloneFromTemplate } from "./utilities.js";

export class AppStatusView {
	#templateid;
	#uuid;
	#containerid;
	#internalContainer;
	
	
	constructor (params) {
		this.#templateid = params.templateid;
		this.#containerid = params.containerid;
		this.#uuid = self.crypto.randomUUID();	
		this.#internalContainer = document.querySelector(this.#containerid);
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		this.#internalContainer.appendChild(clone);
		
		this.spinnerelement = this.#internalContainer.querySelector('#statusloading'+this.#uuid);
		// expecting svg icons in a template
		this.dbfilesvg = this.#internalContainer.querySelector('#dbfilestatus'+this.#uuid).querySelector("svg");
		this.pyodidesvg = this.#internalContainer.querySelector('#pyodidestatus'+this.#uuid).querySelector("svg");
		this.duckdbsvg = this.#internalContainer.querySelector('#duckdbstatus'+this.#uuid).querySelector("svg");
		
		this.spinnercounter = 0;
		this.resetSpinner();
	}
	
	get uuid() {
		return this.#uuid;
	}
	
	updateSpinner() {
		if (this.spinnercounter===0) {
			this.spinnerelement.style.display = 'none';
		} else if (this.spinnercounter>0) { 
			this.spinnerelement.style.display = 'block';
		} else {
			this.resetSpinner();
		}
	}
	
	resetSpinner() {
		this.spinnercounter=0;
		this.spinnerelement.style.display = 'none';
	}
	
	showSpinner() {
		this.spinnercounter++;
		this.updateSpinner();
	}
	
	hideSpinner() {
		this.spinnercounter--;
		this.updateSpinner();
	}
	
	updateSvgIcon(statustext, iconelement) {

		if (statustext.includes('_success')) {
			//console.log("STATUS TEXT TO GREEN: ", statustext, iconelement);
			iconelement.style.stroke = "green";
			this.hideSpinner();
		} else if (statustext.includes('_error')) {
			iconelement.style.stroke = "red";
			this.hideSpinner();
		} else {
			iconelement.style.stroke = "yellow";
			this.showSpinner();
		}
			
	} 
	
	duckdbStatusChange(eventdata) {
		this.updateSvgIcon(eventdata.state, this.duckdbsvg) 
	}
	
	pyodideStatusChange(eventdata) {
		this.updateSvgIcon(eventdata.state, this.pyodidesvg) 
	}
	
	dbfileStatusChange(eventdata) {
		this.updateSvgIcon(eventdata.state, this.dbfilesvg) 
	}
	
}
