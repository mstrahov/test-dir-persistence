/**********
 * gridItemSelectFileDialog
 * depends: Tabulator.js
 * extends gridItemFileDialog adding file selection features for selecting files inside the script
 * 
 ***********************************   */
import { gridItemFileDialog } from "./griditemfiledialog.js";

export class gridItemSelectFileDialog extends gridItemFileDialog {
	
	constructor (params) {
		super(params);
		
	}

	async init() {
		await super.init();
		
	}

}

