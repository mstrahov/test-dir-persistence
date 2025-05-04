/* ********
 * gridItemFileDialog
 * depends: Tabulator.js
 * 
 * 
 *   */
import { GridItemWithMenu } from "./griditemwithmenu.js";


export class gridItemFileDialog extends GridItemWithMenu {
	
	constructor (params) {
		super(params);
		this.fileIOHandler = params.fileIOHandler;
	}
	
	async init() {
		
		
	}
	
}
