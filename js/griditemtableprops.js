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
		} else if (eventdata?.menuItemId === "updatecolumnscmdgriditem" || eventdata?.menuItemId === "syncaction"  ) {   // 
			//~ this.eventbus.dispatch('editSQLcommandgriditem', this, { sqlcommand: this.sqlcommand });
			const newColumnProperties = this.generateNewDefinitions();
			console.log("Generating new columns definitions: ", newColumnProperties);
			this.eventbus.dispatch('updatecolumnscmdgriditem', this, { newColumnProperties: newColumnProperties });
			
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });		
		}  else if (eventdata?.menuItemId === "copylayoutasjsoncmdgriditem") {
			const newColumnProperties = this.generateNewDefinitions();
			(async (text)=> {await navigator.clipboard.writeText(text);})(JSON.stringify(newColumnProperties, null, " "));
		}
		
		
		
		
	}
	// -------------------------------------------------------------------------
	// -------------------------------------------------------------------------
	refreshData() {
	
		if (!this.columnprops || this.columnprops.length===0 ) {
			return false;
		}
		this.showTabulatorProps();
	}
	
	// -------------------------------------------------------------------------
	
	updateColProps(newColProps) {
		this.columnprops = [...newColProps];
		this.refreshData();
	}
	
	// -------------------------------------------------------------------------
	
	generateNewDefinitions() {
		let res = [];
		if (!this.tabulatorobj || !this.columnprops) {
			return null;
		}
		
		let curData = this.tabulatorobj.getData();
		
		console.log("Tabulator data:", curData);
		
		if (curData.length===0) {
			return null;
		}
		
		
		let rowInd = 0;
		
		//for (let i=0;i<curData.length;i++) {
			
			// Array.isArray(this.tabulatorobj.getData()[0].ColumnGroup1cssClass)
			// this.tabulatorobj.getData()[0].ColumnGroup1cssClass.toString().replaceAll(',',' ').replaceAll('.','').replaceAll('   ',' ').replaceAll('  ',' ').trim()
			// ColumnGroup1headerHozAlign
			
		//}
		
		// *********************************************
		function generateOneLine(rowIndex) {
			let res = {};
			
			if (rowIndex<0 || rowIndex>=curData.length) { return res; }
			
			for (let propName in curData[rowIndex]) { 
		
				if (propName==="title" || propName==="field") {
					res[propName] = curData[rowIndex][propName];
					
				} else if (propName.includes('ColumnGroup')) {
				    //
				} else if (propName.includes('sorterParams_') || propName.includes('formatterParams_')) {
					const propertyNames = propName.split("_");
					const propValue = curData[rowIndex][propName].toString().trim();
					if (propValue !== '') {
						if (!res.hasOwnProperty(propertyNames[0])) {
							res[propertyNames[0]] = {};
						}
						if (propValue === 'true') {
							res[propertyNames[0]][propertyNames[1]]  = true;
						} else if (propValue === 'false') {
							res[propertyNames[0]][propertyNames[1]] = false;
						} else  { 
							res[propertyNames[0]][propertyNames[1]] = propValue;
						}
					}
					
				} else if (propName==="_row_index") {
					//
				} else {
					const propIndex = tabulatorColumnPropertiesNames.findIndex(v=>v.field===propName);
					if (propIndex>-1) {
						if (tabulatorColumnPropertiesNames[propIndex].fieldtype === 'number') {
							if (typeof curData[rowIndex][propName] !== 'string') {
								res[propName] = curData[rowIndex][propName];
							}
						} else if (tabulatorColumnPropertiesNames[propIndex].fieldtype.includes('multilistopen')) {
							let propValue = curData[rowIndex][propName].toString().replaceAll(',',' ').replaceAll('.','').replaceAll('   ',' ').replaceAll('  ',' ').trim();
							if (propValue !== '') { 
								res[propName] = propValue;
							}
							
						} else if (tabulatorColumnPropertiesNames[propIndex].fieldtype.includes('list')) {
							let propValue = curData[rowIndex][propName].toString().trim();
							if (propValue === 'true') {
								res[propName] = true;
							} else if (propValue === 'false') {
								res[propName] = false;
							} else if (propValue !== '') { 
								res[propName] = propValue;
							}
						}
					}	
				}

			}	
			
			return res;
		}
		// *********************************************
		
		function genColumnLevel(colGroupLevel, colGroupPath) {
			let colres = {};
			let colGroupName = curData[rowInd][`ColumnGroup${colGroupLevel}`].trim();
			colres.title = colGroupName;
			colres.columns = [];
			// ColumnGroup1cssClass
			let propValue = curData[rowInd][`ColumnGroup${colGroupLevel}cssClass`].toString().replaceAll(',',' ').replaceAll('.','').replaceAll('   ',' ').replaceAll('  ',' ').trim();
			if (propValue!=='') {
				colres.cssClass = propValue;
			}
			// ColumnGroup1headerHozAlign
			propValue = curData[rowInd][`ColumnGroup${colGroupLevel}headerHozAlign`].toString().replaceAll(',',' ').replaceAll('.','').replaceAll('   ',' ').replaceAll('  ',' ').trim();
			if (propValue!=='') {
				colres.headerHozAlign = propValue;
			}
						
			
			rowIndLoop: while (rowInd<curData.length) {
				let rowobj;
		
				for (let j=0;j<colGroupPath.length;j++) {
					// go back to prev level if one of the group names change in a new line
					const grpName = curData[rowInd][`ColumnGroup${j+1}`].trim();
					if (grpName!==colGroupPath[j]) {
						break rowIndLoop;
					}
				}
		
				let nextColGroup = '';
				let nextColLevel = colGroupLevel + 1;
				if (colGroupLevel<2) {
					nextColGroup = curData[rowInd][`ColumnGroup${nextColLevel}`].trim();
				}
				
				if (nextColGroup!=='') {
					rowobj = genColumnLevel( nextColLevel , [...colGroupPath, nextColGroup]);	
				} else {
					rowobj = generateOneLine(rowInd);	
					rowInd++;
				}
								
				colres.columns.push(rowobj);
					
			}
			
			return colres;
		}
		// *********************************************
		
		while (rowInd<curData.length) {
			
			// ColumnGroup1 cannot be empty (if ColumnGroup1 is empty, and ColumnGroup2 is not, ColumnGroup2 is ignored
			let colGroup1 = curData[rowInd].ColumnGroup1.trim();
			
			let rowobj;
			if (colGroup1!=='') {
				rowobj = genColumnLevel(1, [colGroup1]);
			} else { 
				rowobj = generateOneLine(rowInd);
				
				rowInd++;
			}
			res.push(rowobj);
		}
		
		return res;
	}
	
	
	// ----------------------------------------------------------------------------------------------------------------------------
	showTabulatorProps() {
		
		console.log("Received column properties: ", this.columnprops);
		
		//  need to destroy and recreate tabulator object to correctly display changes in col/row qty and definitions
		try {
			if (this.tabulatorobj) {
				this.lastcolumnlayout = this.tabulatorobj.getColumnLayout();
				this.tabulatorobj.destroy();
			}
		} catch (err) { console.error(err); }
		
	
		this.tabulatorobj = new Tabulator(this.#internalContainer, {
						...this.tabulatorProperties,
						data: this.generateTableData(),  
						index: "_row_index",
						clipboard:true,
						//selectableRange:true,
						//selectableRangeRows:true,
						//clipboardCopyRowRange:"range",
						
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
		
		const cellContextMenu = [
			{
				label:"Copy",
				action:function(e, cell){
					(async (text)=> {await navigator.clipboard.writeText(text);})(cell.getValue());
				}
			},
			{
				label:"Paste",
				action:function(e, cell){
					navigator.clipboard.readText().then( (clipText) => { cell.setValue(clipText)  }, );
				}
			},
		];
		
		
		for (let i=0;i<tabulatorColumnPropertiesNames.length;i++) {
			
			let newCol = {
				title: tabulatorColumnPropertiesNames[i].name,
				field: tabulatorColumnPropertiesNames[i].field,
				width: tabulatorColumnPropertiesNames[i].width,
				visible: tabulatorColumnPropertiesNames[i].visible,
				frozen: tabulatorColumnPropertiesNames[i].frozen,
				contextMenu: cellContextMenu,
			};
			
			if (tabulatorColumnPropertiesNames[i].name!=="field") {
				newCol.editor = true;
			}
			
			
			if (tabulatorColumnPropertiesNames[i].fieldtype === "number") {
				newCol.hozAlign = "right";
				newCol.sorter = "number";
				newCol.editor = "number";
			} else if (tabulatorColumnPropertiesNames[i].fieldtype === "list") {
				newCol.editor = "list";
				newCol.editorParams = {
					 values: [...tabulatorColumnPropertiesNames[i].valuelist],
					 clearable:true,
					 autocomplete:true,
					 multiselect:false,
					 emptyValue:'',
					 freetext:false,
					 allowEmpty:true,
				};
			} else if (tabulatorColumnPropertiesNames[i].fieldtype === "listopen") {
				newCol.editor = "list";
				newCol.editorParams = {
					 values: [...tabulatorColumnPropertiesNames[i].valuelist],
					 clearable:true,
					 autocomplete:true,
					 multiselect:false,
					 emptyValue:'',
					 freetext:true,
					 allowEmpty:true,
				};
			} else if (tabulatorColumnPropertiesNames[i].fieldtype === "multilistopen") {
				newCol.editor = "list";
				newCol.editorParams = {
					 values: [...tabulatorColumnPropertiesNames[i].valuelist],
					 clearable:true,
					 autocomplete:false,
					 multiselect:true,
					 //emptyValue:'',
					 //freetext:true,
					 //allowEmpty:true,
				};
			}
			 
			res.push(newCol);
		}
		
		
		return res;
	}

	// -------------------------------------------------------------------------
	generateTableData() {
		let resArray = [];
		// this.columnprops
		
		// **********
		//~ for (let i=0;i<this.columnprops.length;i++) {
			//~ let newrow = { "_row_index": i };
			//~ for (let j=0;j<tabulatorColumnPropertiesNames.length;j++) {
				//~ if (tabulatorColumnPropertiesNames[j].field in this.columnprops[i]) {
					
					//~ if (typeof this.columnprops[i][tabulatorColumnPropertiesNames[j].field] === 'boolean') {
						//~ newrow[tabulatorColumnPropertiesNames[j].field] = this.columnprops[i][tabulatorColumnPropertiesNames[j].field].toString();
					//~ } else {
						//~ newrow[tabulatorColumnPropertiesNames[j].field] = this.columnprops[i][tabulatorColumnPropertiesNames[j].field];
					//~ }
				//~ } else {
					//~ newrow[tabulatorColumnPropertiesNames[j].field] = " ";
				//~ }
				
			//~ }
			//~ resArray.push(newrow);
		//~ }
		// ***********
		
		function createNewRow(propsrowobj, colArray) {
			let newrow = { "_row_index": resArray.length };
			
			for (let j=0;j<colArray.length && j<2;j++) {     //  flatten max 2 nested column groups: ColumnGroup1, ColumnGroup2
				// `ColumnGroup${j+1}`    title
				// `ColumnGroup${j+1}cssClass`   cssClass
				// `ColumnGroup${j+1}headerHozAlign`   headerHozAlign
				if (colArray[j].hasOwnProperty('title')) {
					newrow[`ColumnGroup${j+1}`] = colArray[j].title;
				} else {
					newrow[`ColumnGroup${j+1}`] = 'Unknown';
				}
				if (colArray[j].hasOwnProperty('cssClass')) {
					newrow[`ColumnGroup${j+1}cssClass`] = colArray[j].cssClass.toString();
				}
				if (colArray[j].hasOwnProperty('headerHozAlign')) {
					newrow[`ColumnGroup${j+1}headerHozAlign`] = colArray[j].headerHozAlign.toString();
				}	
			}
			
			for (let j=0;j<tabulatorColumnPropertiesNames.length;j++) {
				if (tabulatorColumnPropertiesNames[j].field in propsrowobj) {
					
					if (typeof propsrowobj[tabulatorColumnPropertiesNames[j].field] === 'boolean') {
						newrow[tabulatorColumnPropertiesNames[j].field] = propsrowobj[tabulatorColumnPropertiesNames[j].field].toString();
					} else {
						newrow[tabulatorColumnPropertiesNames[j].field] = propsrowobj[tabulatorColumnPropertiesNames[j].field];
					}
				} else {
					
					//~ {field:"sorterParams_format"
					//~ {field:"sorterParams_alignEmptyValues"
					//~ {field:"formatterParams_inputFormat"
					//~ {field:"formatterParams_outputFormat"
					if (tabulatorColumnPropertiesNames[j].field.includes('_')) {
						const fldArr = tabulatorColumnPropertiesNames[j].field.split("_");
						if ((fldArr.length>1) && (fldArr[0] in propsrowobj) && propsrowobj[fldArr[0]].hasOwnProperty(fldArr[1])) {
							if (typeof propsrowobj[fldArr[0]][fldArr[1]] === 'boolean') {
								newrow[tabulatorColumnPropertiesNames[j].field] = propsrowobj[fldArr[0]][fldArr[1]].toString();
							} else {
								newrow[tabulatorColumnPropertiesNames[j].field] = propsrowobj[fldArr[0]][fldArr[1]];
							}
						}
					}
					
					
					if (!newrow.hasOwnProperty(tabulatorColumnPropertiesNames[j].field)) {
						newrow[tabulatorColumnPropertiesNames[j].field] = " ";
					}
				}
				
			}
			
			return newrow;
		}
		// ***********
		function addMergedColumn(colobj, colArray ) {
			let curcolArray = [...colArray,colobj];
			for (let i=0;i<colobj.columns.length;i++) {
				if (colobj.columns[i].hasOwnProperty('columns')) {
					addMergedColumn(colobj.columns[i] , curcolArray );
				} else {
					resArray.push(createNewRow(colobj.columns[i], curcolArray));
				}
			}	
			return true;
		}
		
		// ***********
		for (let i=0;i<this.columnprops.length;i++) {
			if (this.columnprops[i].hasOwnProperty('columns')) {
				addMergedColumn(this.columnprops[i] , [] );
			} else {
				resArray.push(createNewRow(this.columnprops[i], []));
			}
		}
		
		
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

{field:"field", docs:"", name:"field", fieldtype:"string", valuelist:[""], frozen: true, visible: true, width:110,},
{field:"title", docs:"", name:"title", fieldtype:"string", valuelist:[""], frozen: false, visible: true, width:180,},
{field:"ColumnGroup1", docs:"", name:"Column Group 1", fieldtype:"string", valuelist:[""], frozen: false, visible: true, width:110,},
{field:"ColumnGroup1cssClass", docs:"", name:"Column Group1 cssClass", fieldtype:"multilistopen", valuelist:["text-primary","text-secondary","text-success","text-danger","text-warning","text-info","text-light","text-dark","text-body","text-muted","text-white","text-black-50","text-white-50","bg-primary","bg-secondary","bg-success","bg-danger","bg-warning","bg-info","bg-light","bg-dark","bg-body","bg-white","bg-transparent"," "], frozen: false, visible: true, width:110,},
{field:"ColumnGroup1headerHozAlign", docs:"", name:"Column Group1 headerHozAlign", fieldtype:"list", valuelist:["left","center","right"," "], frozen: false, visible: true, width:110,},
{field:"ColumnGroup2", docs:"", name:"Column Group 2", fieldtype:"string", valuelist:[""], frozen: false, visible: true, width:110,},
{field:"ColumnGroup2cssClass", docs:"", name:"Column Group 2 cssClass", fieldtype:"multilistopen", valuelist:["text-primary","text-secondary","text-success","text-danger","text-warning","text-info","text-light","text-dark","text-body","text-muted","text-white","text-black-50","text-white-50","bg-primary","bg-secondary","bg-success","bg-danger","bg-warning","bg-info","bg-light","bg-dark","bg-body","bg-white","bg-transparent"," "], frozen: false, visible: true, width:110,},
{field:"ColumnGroup2headerHozAlign", docs:"", name:"Column Group 2 headerHozAlign", fieldtype:"list", valuelist:["left","center","right"," "], frozen: false, visible: true, width:110,},
{field:"visible", docs:"", name:"visible", fieldtype:"list", valuelist:["true","false"," "], frozen: false, visible: true, width:110,},
{field:"width", docs:"", name:"width", fieldtype:"number", valuelist:[""], frozen: false, visible: true, width:110,},
{field:"hozAlign", docs:"", name:"hozAlign", fieldtype:"list", valuelist:["left","center","right"," "], frozen: false, visible: true, width:110,},
{field:"sorter", docs:"", name:"sorter", fieldtype:"list", valuelist:["string","number","alphanum","boolean","exists","date","time","datetime"," "], frozen: false, visible: true, width:110,},
{field:"sorterParams_format", docs:"", name:"SorterParams format", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"," "], frozen: false, visible: true, width:110,},
{field:"sorterParams_alignEmptyValues", docs:"", name:"SorterParams alignEmptyValues", fieldtype:"list", valuelist:["top","bottom"," "], frozen: false, visible: true, width:110,},
{field:"headerSortTristate", docs:"", name:"headerSortTristate", fieldtype:"list", valuelist:["true","false"," "], frozen: false, visible: true, width:110,},
{field:"formatter", docs:"", name:"formatter", fieldtype:"list", valuelist:["plaintext","textarea","money","datetime","tickCross","progress","toggle","adaptable"," "], frozen: false, visible: true, width:110,},
{field:"formatterParams_inputFormat", docs:"", name:"FormatterParams inputFormat", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"," "], frozen: false, visible: true, width:110,},
{field:"formatterParams_outputFormat", docs:"", name:"FormatterParams outputFormat", fieldtype:"listopen", valuelist:["yyyy-MM-dd","HH:mm:ss","yyyy-MM-dd HH:mm:ss"," "], frozen: false, visible: true, width:110,},
{field:"frozen", docs:"", name:"frozen", fieldtype:"list", valuelist:["false","true"," "], frozen: false, visible: true, width:110,},
{field:"headerVertical", docs:"", name:"headerVertical", fieldtype:"list", valuelist:["false","true","flip"," "], frozen: false, visible: true, width:110,},
{field:"vertAlign", docs:"", name:"vertAlign", fieldtype:"list", valuelist:["top","middle","bottom"," "], frozen: false, visible: true, width:110,},
{field:"headerHozAlign", docs:"", name:"headerHozAlign", fieldtype:"list", valuelist:["left","center","right"," "], frozen: false, visible: true, width:110,},
{field:"minWidth", docs:"", name:"minWidth", fieldtype:"number", valuelist:[""], frozen: false, visible: true, width:110,},
{field:"maxWidth", docs:"", name:"maxWidth", fieldtype:"number", valuelist:[""], frozen: false, visible: true, width:110,},
{field:"resizable", docs:"", name:"resizable", fieldtype:"list", valuelist:["true","false","header","cell"," "], frozen: false, visible: true, width:110,},
{field:"print", docs:"", name:"print", fieldtype:"list", valuelist:["true","false"," "], frozen: false, visible: true, width:110,},
{field:"clipboard", docs:"", name:"clipboard", fieldtype:"list", valuelist:["true","false"," "], frozen: false, visible: true, width:110,},
{field:"variableHeight", docs:"", name:"variableHeight", fieldtype:"list", valuelist:["false","true"," "], frozen: false, visible: true, width:110,},
{field:"editor", docs:"https://tabulator.info/docs/6.3/edit", name:"editor", fieldtype:"list", valuelist:["false","true","number","textarea","input"," "], frozen: false, visible: true, width:110,},
{field:"validator", docs:"https://tabulator.info/docs/6.3/validate", name:"validator", fieldtype:"list", valuelist:["required","unique","integer","float","numeric","string","alphanumeric"," "], frozen: false, visible: true, width:110,},
{field:"topCalc", docs:"", name:"topCalc", fieldtype:"list", valuelist:["avg","max","min","sum","count","unique","false"," "], frozen: false, visible: true, width:110,},
{field:"topCalcFormatter", docs:"https://www.tabulator.info/docs/6.3/column-calcs#format", name:"topCalcFormatter", fieldtype:"list", valuelist:["plaintext","textarea","money","datetime","tickCross","progress","toggle","adaptable"," "], frozen: false, visible: true, width:111,},
{field:"bottomCalc", docs:"", name:"bottomCalc", fieldtype:"list", valuelist:["avg","max","min","sum","count","unique","false"," "], frozen: false, visible: true, width:110,},
{field:"bottomCalcFormatter", docs:"https://www.tabulator.info/docs/6.3/column-calcs#format", name:"bottomCalcFormatter", fieldtype:"list", valuelist:["plaintext","textarea","money","datetime","tickCross","progress","toggle","adaptable"," "], frozen: false, visible: true, width:111,},
{field:"headerSort", docs:"", name:"headerSort", fieldtype:"list", valuelist:["true","false"," "], frozen: false, visible: true, width:110,},
{field:"headerWordWrap", docs:"", name:"headerWordWrap", fieldtype:"list", valuelist:["false","true"," "], frozen: false, visible: true, width:110,},
{field:"editableTitle", docs:"", name:"editableTitle", fieldtype:"list", valuelist:["false","true"," "], frozen: false, visible: true, width:110,},
{field:"cssClass", docs:"value should be a string containing space separated class names", name:"cssClass", fieldtype:"multilistopen", valuelist:["text-primary","text-secondary","text-success","text-danger","text-warning","text-info","text-light","text-dark","text-body","text-muted","text-white","text-black-50","text-white-50","bg-primary","bg-secondary","bg-success","bg-danger","bg-warning","bg-info","bg-light","bg-dark","bg-body","bg-white","bg-transparent"," "], frozen: false, visible: true, width:110,},


];

