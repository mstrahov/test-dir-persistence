/******************************************
 * Picker based on tabulator object
 * requires bootstrap 5, Tabulator.js
 * 
 * returns a promise / selected row or rows array if selectableRows is overridden and>1
 * **********************************************/
import { makeCloneFromTemplate } from "./utilities.js";

export class TabulatorPicker {
	#templateid;
	#modalelement;
	#modalelementtitle;
	#modalobject;
	#modaltabulatorcontainer;
	#optionselected;
	#uuid;
	#tabulatorobj;
	
	constructor(params) {
		this.#templateid = params.templateid;
		this.#uuid = self.crypto.randomUUID();
		
		
		//~ const template = document.querySelector(this.#templateid);
		//~ const clone = template.content.cloneNode(true);
		//~ clone.querySelector('#pickermodal').setAttribute("aria-labelledby","pickerModalLabel" +this.#uuid);
		//~ clone.querySelector('#pickermodal').id = 'pickermodal'+this.#uuid;
		//~ clone.querySelector('#pickerModalLabel').id = 'pickerModalLabel'+this.#uuid;
		//~ clone.querySelector('#pickermodalSelectButton').id = 'pickermodalSelectButton'+this.#uuid;
		
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		clone.querySelector('#pickermodal'+this.#uuid).setAttribute("aria-labelledby","pickerModalLabel" +this.#uuid);
		
		document.body.appendChild(clone);	
		
		this.#modalelement = document.getElementById('pickermodal'+this.#uuid);
		this.#modalobject =  new bootstrap.Modal(this.#modalelement, {
		  backdrop: 'static'
		});	
		this.#modalelement.addEventListener('hide.bs.modal', this.eventModalDismissed.bind(this));
		document.getElementById('pickermodalSelectButton'+this.#uuid).addEventListener('click', this.eventSelectButtonClick.bind(this));
		this.#optionselected = false;
		
		this.#modaltabulatorcontainer = document.getElementById('pickermodal'+this.#uuid).querySelector('.modal-body');
		this.#modalelementtitle = document.getElementById('pickerModalLabel'+this.#uuid);
		
		this.promise = null;
		this.resolve = null;
		this.reject = null;
	}
	
	// -------------------------------------------------------------
	show() {
		this.#modalobject.show();
		this.#optionselected = false;
	}
	
	// -------------------------------------------------------------
	setTitle(strTitle) {
		this.#modalelementtitle.innerText = strTitle;
	}
	// -------------------------------------------------------------
	async showoptions(tabulatorprops) {
		try {
			if (this.#tabulatorobj) {
				this.#tabulatorobj.destroy();
			} 
		} catch (err) {
			console.log("Error dialog tabulator destroy.", err);
		}
		
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
		//~ const data = [
		  //~ { id: 1, name: "John Doe", age: 30 },
		  //~ { id: 2, name: "Jane Smith", age: 25 },
		  //~ { id: 3, name: "Bob Johnson", age: 35 },
		  //~ { id: 4, name: "Alice Williams", age: 28 },
		//~ ];

		//~ const columns = [
			//~ { title: "ID", field: "id" },
			//~ { title: "Name", field: "name" },
			//~ { title: "Age", field: "age" },
		 //~ ];
			
		this.#tabulatorobj = new Tabulator(this.#modaltabulatorcontainer , {
			layout:"fitColumns",
			movableRows:false,
			selectableRows:1,
			selectableRowsPersistence:false,
			...tabulatorprops,
			
		});
		
		this.#tabulatorobj.on("rowDblClick", this.eventTabulatorRowDblClick.bind(this));
		this.#tabulatorobj.on("rowDblTap", this.eventTabulatorRowDblClick.bind(this));
		
		if (tabulatorprops?.dialogTitle) { 
			this.setTitle(tabulatorprops.dialogTitle);
		}
		this.#modalobject.show();
		this.#optionselected = false;
		
		return this.promise;
			
	}
	
	eventModalDismissed() {
		try {
			if (this.#tabulatorobj) {
				this.#tabulatorobj.destroy();
			} 
		} catch (err) {
			console.log("Error dialog tabulator destroy.", err);
		}
		if (!this.#optionselected) {
			//console.log('Modal dismissed/ closed');
			this.reject(new Error('No option selected'));
		}	
		
	}
		
	eventSelectButtonClick() {
		//console.log('Modal select clicked');
		
		const selectedRows = this.#tabulatorobj.getSelectedRows(); 
		if (selectedRows.length===0) {
			this.#tabulatorobj.alert('Please click on a row to select.');
			setTimeout(() => this.#tabulatorobj.clearAlert(), 2000);
			
		} else if (selectedRows.length===1)  {
			// single row selection
			const selectedOption = selectedRows[0].getData();
			this.#optionselected = true;	
			this.#modalobject.hide();
			this.resolve(selectedOption);
		} else {
			// multiple selection 
			let selectedOption = [];
			for (let r in selectedRows) {
				selectedOption.push(selectedRows[r].getData());
			}
			this.#optionselected = true;	
			this.#modalobject.hide();
			this.resolve(selectedOption);
		}
		
	}
	
	eventTabulatorRowDblClick(e, row) {
		//e - the click event object
		//row - row component
		const selectedOption = row.getData();
		this.#optionselected = true;	
		this.#modalobject.hide();
		this.resolve(selectedOption);
	}
	
}


