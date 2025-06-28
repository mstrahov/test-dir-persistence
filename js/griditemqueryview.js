/**********************************
 * gridItemQueryView
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */


import { GridItemWithMenu } from "./griditemwithmenu.js";

export class gridItemQueryView extends GridItemWithMenu {
	#internalContainer;
	
	constructor (params) {
		super(params);
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.coderunner = params.coderunner;
		this.parentuuid = params.parentuuid;
		
		this.awaitingrefresh = false;
		
		this.pyodidePromise = this.coderunner.getpyodidePromise();
		this.dfname = params.dfname || 'df';
		this.tabulatorProperties = params.tabulatorProperties || {};
		this.headerContextMenuGeneratorFunction = undefined; 
		this.cellContextMenuGeneratorFunction = undefined; 
		this.#internalContainer = this.bodyelement;
		this.pyodide = undefined;
		this.getdfcmd =  this.dfname + ".to_json(orient='split',date_format='iso')";
		this.gettypescmd = this.dfname + ".dtypes.to_json(orient='split',default_handler=str)";	
		// TODO: automatically adjust number of records to output based on df's length ??  	
		this.tabulatorobj = undefined;
		this.columnsarray = [];
		this.columnstypes = undefined;
		this.lastcolumnlayout = undefined;
		if (params.columnlayout) {
			try {
				this.lastcolumnlayout = JSON.parse(JSON.stringify(params.columnlayout));
			} catch (err) {
				console.warn("Error processing initial column layout",err);
			}
		}
		
		
	}
	
	// -------------------------------------------------------------------------
	
	async init() {
		
		this.pyodide = await this.pyodidePromise;
		
	}
	
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//~ console.log("griditemTableDFPaged widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction") {
			this.showdf();
		} else if (eventdata?.menuItemId === "refreshgriditem") {
			this.showdf();
		} else if (eventdata?.menuItemId === "choosedataframegriditem") {
			this.eventbus.dispatch('requestDataFrameChange', this, { dfname: this.dfname });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		}
		
		// 
	}
		// -------------------------------------------------------------------------
	
}
