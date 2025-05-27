/******************************************
 * Modal dialog with input field 
 * requires bootstrap 5
 * 
 * returns a promise / input field value
 * **********************************************/

import { makeCloneFromTemplate } from "./utilities.js";

export class modalDialogInput {
	#templateid;
	#modalelement;
	#modalelementtitle;
	#modalobject;
	#modaltabulatorcontainer;
	#optionselected;
	#uuid;
	
	
	constructor(params) {
		this.#templateid = params.templateid;
		this.#uuid = self.crypto.randomUUID();
		
		
	}
	
	
	
}
