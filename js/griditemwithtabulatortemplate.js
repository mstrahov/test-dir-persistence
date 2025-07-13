/**********************************
 * gridItemTableProps
 * depends: Tabulator.js
 * 
 * shows/edits column properties of another tabulator object
 * 
 ***********************************   */

import { GridItemWithMenu } from "./griditemwithmenu.js";

export class gridItemTableProps extends GridItemWithMenu {
	#internalContainer;
	
	constructor (params) {
		super(params);
		
	
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.parentuuid = params.parentuuid;
		this.columnprops = params.columnprops?params.columnprops:[];
		
		this.tabulatorProperties = params.tabulatorProperties || {};
		this.#internalContainer = this.bodyelement;
		this.tabulatorobj = undefined;
		
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
	init() {
		
		//~ this.pyodide = await this.pyodidePromise;
		this.refreshData();
	}
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//~ console.log("gridItemQueryView widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction" || eventdata?.menuItemId === "refreshgriditem") {
			this.refreshData();
		} else if (eventdata?.menuItemId === "editSQLcommandgriditem") {
			this.eventbus.dispatch('editSQLcommandgriditem', this, { sqlcommand: this.sqlcommand });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		}
		
	}
	// -------------------------------------------------------------------------
	// -------------------------------------------------------------------------
	refreshData() {
	
		if (!this.columnprops) {
			return false;
		}
		this.showTabulatorProps();
	}
	
	// -------------------------------------------------------------------------
	
	updateColProps(newColProps) {
		this.columnprops = newColProps;
		this.refreshData();
	}
	
	// -------------------------------------------------------------------------
	
	showTabulatorProps() {
		
		console.log(this.columnprops);
		
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				this.tabulatorobj.destroy();
			}
		} catch (err) { console.error(err); }
		
		this.tabulatorProperties = {
					...this.tabulatorProperties,
					data: this.generateTableData(),   
			};
	
		this.tabulatorobj = new Tabulator(this.#internalContainer, {
						...this.tabulatorProperties,
						index: "_row_index",
						selectableRange:true,
						//selectableRangeRows:true,
						clipboardCopyRowRange:"range",
						
						columns: this.generateColumnDefinitions(),
						
						// --------------------------------------
						columnDefaults:{
							tooltip:function(e, cell, onRendered){
								var el = document.createElement("div");
								el.innerText = cell.getValue(); 
								return el; 
							},
						}	
					});
		
		//~ this.columnsarray = [...dfarray.columns];
		this.tabulatorobj.on("tableBuilt", this.eventTableBuilt.bind(this));
	
	}
	
	// -------------------------------------------------------------------------
	
	eventTableBuilt() {
		this.eventbus.dispatch('tableBuilt', this, {});	
	}
	// -------------------------------------------------------------------------
	
	generateColumnDefinitions() {
		let res = [];
		let colwidth = 25;
		
		colwidth = 25;
		if (this.lastcolumnlayout) {
			let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="_row_index");
			if (oldlayout) {
				colwidth = oldlayout?.width;
			}
		}
		res.push({
				title: "",
				field: "_row_index",
				width: colwidth,
				hozAlign: "left",
				sorter: "number",
				headerSortTristate:true,
				formatter: "plaintext",
				frozen:false, 
		});
		
		
		
		
		return res;
	}

	// -------------------------------------------------------------------------
	generateTableData() {
		let resArray = [];
		// this.columnprops


		// **********
		return resArray;
	}
	// -------------------------------------------------------------------------
	
	destroy() {
		if (this.tabulatorobj) {
			try {
				this.tabulatorobj.destroy();
			} catch (err) { console.error(err); }
		}
		super.destroy();
	}
	// ------------------------------------
	
	toOwnFormat() {
		let res = super.toOwnFormat();
		res.parentuuid = this.parentuuid;
		// ------------
		if (this.tabulatorobj) {
			try {
				//res.tabulatorProperties = JSON.parse(JSON.stringify(this.tabulatorProperties));
				res.columnlayout = this.tabulatorobj.getColumnLayout();
			} catch (e) { console.warn("Column layout save error",e); }
		}	
		return res;
	}
	
	
	// -------------------------------------------------------------------------
	
}

export const tabulatorColumnPropertiesNames =
[
{field:"title", docs:"", name:"title", fieldtype:"string", valuelist:[""], width:110,},
{field:"field", docs:"", name:"field", fieldtype:"string", valuelist:[""], width:110,},
{field:"ColumnGroup1", docs:"", name:"ColumnGroup1", fieldtype:"string", valuelist:[""], width:110,},
{field:"ColumnGroup1cssClass", docs:"", name:"ColumnGroup1cssClass", fieldtype:"multilistopen", valuelist:[".text-primary",".text-secondary",".text-success",".text-danger",".text-warning",".text-info",".text-light",".text-dark",".text-body",".text-muted",".text-white",".text-black-50",".text-white-50"], width:110,},
{field:"ColumnGroup2", docs:"", name:"ColumnGroup2", fieldtype:"string", valuelist:[""], width:110,},
{field:"ColumnGroup2cssClass", docs:"", name:"ColumnGroup2cssClass", fieldtype:"multilistopen", valuelist:[".text-primary",".text-secondary",".text-success",".text-danger",".text-warning",".text-info",".text-light",".text-dark",".text-body",".text-muted",".text-white",".text-black-50",".text-white-50"], width:110,},
{field:"visible", docs:"", name:"visible", fieldtype:"list", valuelist:["true","false"], width:110,},
{field:"width", docs:"", name:"width", fieldtype:"number", valuelist:[""], width:110,},
{field:"hozAlign", docs:"", name:"hozAlign", fieldtype:"list", valuelist:["left","center","right"], width:110,},
{field:"sorter", docs:"", name:"sorter", fieldtype:"list", valuelist:["string","number","alphanum","boolean","exists","date","time","datetime"], width:110,},
{field:"sorterParams_format", docs:"", name:"sorterParams_format", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"], width:110,},
{field:"sorterParams_alignEmptyValues", docs:"", name:"sorterParams_alignEmptyValues", fieldtype:"list", valuelist:["top","bottom"], width:110,},
{field:"headerSortTristate", docs:"", name:"headerSortTristate", fieldtype:"list", valuelist:["true","false"], width:110,},
{field:"formatter", docs:"", name:"formatter", fieldtype:"list", valuelist:["plaintext","textarea","money","datetime","tickCross","progress","toggle","adaptable"], width:110,},
{field:"formatterParams_inputFormat", docs:"", name:"formatterParams_inputFormat", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"], width:110,},
{field:"formatterParams_outputFormat", docs:"", name:"formatterParams_outputFormat", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"], width:110,},
{field:"frozen", docs:"", name:"frozen", fieldtype:"list", valuelist:["false","true"], width:110,},
{field:"headerVertical", docs:"", name:"headerVertical", fieldtype:"list", valuelist:["false","true","flip"], width:110,},
{field:"vertAlign", docs:"", name:"vertAlign", fieldtype:"list", valuelist:["top","middle","bottom"], width:110,},
{field:"headerHozAlign", docs:"", name:"headerHozAlign", fieldtype:"list", valuelist:["left","center","right"], width:110,},
{field:"minWidth", docs:"", name:"minWidth", fieldtype:"integer", valuelist:[""], width:110,},
{field:"maxWidth", docs:"", name:"maxWidth", fieldtype:"integer", valuelist:[""], width:110,},
{field:"resizable", docs:"", name:"resizable", fieldtype:"list", valuelist:["true","false","header","cell"], width:110,},
{field:"print", docs:"", name:"print", fieldtype:"list", valuelist:["true","false"], width:110,},
{field:"clipboard", docs:"", name:"clipboard", fieldtype:"list", valuelist:["true","false"], width:110,},
{field:"variableHeight", docs:"", name:"variableHeight", fieldtype:"list", valuelist:["false","true"], width:110,},
{field:"editable", docs:"https://tabulator.info/docs/6.3/edit", name:"editable", fieldtype:"list", valuelist:["false","true"], width:110,},
{field:"validator", docs:"https://tabulator.info/docs/6.3/validate", name:"validator", fieldtype:"list", valuelist:["required","unique","integer","float","numeric","string","alphanumeric"], width:110,},
{field:"topCalc", docs:"", name:"topCalc", fieldtype:"list", valuelist:["avg","max","min","sum","count","unique","none"], width:110,},
{field:"bottomCalc", docs:"", name:"bottomCalc", fieldtype:"list", valuelist:["avg","max","min","sum","count","unique","none"], width:110,},
{field:"headerSort", docs:"", name:"headerSort", fieldtype:"list", valuelist:["true","false"], width:110,},
{field:"headerWordWrap", docs:"", name:"headerWordWrap", fieldtype:"list", valuelist:["false","true"], width:110,},
{field:"editableTitle", docs:"", name:"editableTitle", fieldtype:"list", valuelist:["false","true"], width:110,},
{field:"cssClass", docs:"value should be a string containing space separated class names", name:"cssClass", fieldtype:"multilistopen", valuelist:[".text-primary",".text-secondary",".text-success",".text-danger",".text-warning",".text-info",".text-light",".text-dark",".text-body",".text-muted",".text-white",".text-black-50",".text-white-50"], width:110,},

];

