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
	#inputOneLineElement;
	
	constructor(params) {
		this.#templateid = params.templateid;
		this.#uuid = self.crypto.randomUUID();
		
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		clone.querySelector('#pickermodal'+this.#uuid).setAttribute("aria-labelledby","pickerModalLabel" +this.#uuid);
		
		document.body.appendChild(clone);	
		
		this.#modalelement = document.getElementById('pickermodal'+this.#uuid);
		this.#modalobject =  new bootstrap.Modal(this.#modalelement, {
		  backdrop: 'static'
		});	
		this.#modalelement.addEventListener('hide.bs.modal', this.eventModalDismissed.bind(this));
		this.#modalelement.addEventListener('shown.bs.modal', this.eventModalShown.bind(this));

		document.getElementById('pickermodalSelectButton'+this.#uuid).addEventListener('click', this.eventSelectButtonClick.bind(this));
		this.#optionselected = false;
		
		this.#modaltabulatorcontainer = document.getElementById('pickermodal'+this.#uuid).querySelector('.modal-body');
		this.#modalelementtitle = document.getElementById('pickerModalLabel'+this.#uuid);
		this.#inputOneLineElement = document.getElementById('inputoneline'+this.#uuid);
		this.#inputOneLineElement.addEventListener("keypress", this.keyPressedEvent.bind(this));
		
		this.promise = null;
		this.resolve = null;
		this.reject = null;
		
	}
	
	// ---------------------------------------------------------------------
	
	keyPressedEvent(e) {
		if (e.code==="Enter") { 
			this.eventSelectButtonClick(); 
		}
	}
	
	// ---------------------------------------------------------------------
	
	show() {
		this.#modalobject.show();
		this.#optionselected = false;
	}
	
	// ---------------------------------------------------------------------
	setTitle(strTitle) {
		this.#modalelementtitle.innerText = strTitle;
	}
	// ---------------------------------------------------------------------
	async showdialog(props) {
		
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});

		if (props?.dialogTitle) { 
			this.setTitle(props.dialogTitle);
		}
		
		if (props?.inputOneLine) { 
			this.#inputOneLineElement.value = props?.inputOneLine;
		} else {
			this.#inputOneLineElement.value = "";
		}
		
		if (props?.inputOneLinePlaceHolder) { 
			this.#inputOneLineElement.placeholder = props?.inputOneLinePlaceHolder;
		} else {
			this.#inputOneLineElement.placeholder = "";
		}
		
		this.#modalobject.show();
		this.#optionselected = false;
		
		return this.promise;
			
	}
	// ---------------------------------------------------------------------
	eventModalDismissed() {
		if (!this.#optionselected) {
			//console.log('Modal dismissed/ closed');
			this.reject(new Error('Dialog cancelled'));
		}	
	}
		
	// ---------------------------------------------------------------------
	
	eventModalShown() {
		this.#inputOneLineElement.focus(); 
	}	
		
	// ---------------------------------------------------------------------
	eventSelectButtonClick() {
		//console.log('Modal OK clicked');
		let res = { inputOneLine: this.#inputOneLineElement.value };
		this.#optionselected = true;	
		this.#modalobject.hide();
		this.resolve(res);
		
	}
	
}
