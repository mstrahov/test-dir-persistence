/*******************
 * Grid item to be created in grid stack
 * 
 * 
 * 
 * ****************************/

import { makeCloneFromTemplate } from "./utilities.js";


export class GridItem {
	#templateid;
	#grid;
	#uuid;
	#bodyelement;
	#headerelement;
	
	constructor (params) {
		this.#templateid = params.templateid;
		this.#grid = params.grid;
		this.#uuid = params.uuid?params.uuid:self.crypto.randomUUID();
		
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		clone.querySelector('#grid-el-header'+this.#uuid).querySelector('.griditemheadertext').textContent = params.headertext;
		//--------------------
		this.#grid.el.appendChild(clone);
		this.#bodyelement= this.#grid.el.querySelector('#grid-el-body'+this.#uuid);
		this.#headerelement= this.#grid.el.querySelector('#grid-el-header'+this.#uuid);
		if (!this.#bodyelement) {
			console.error('grid cannot make widget, id="grid-el-body" is missing in template: ', this.#templateid);
		}
		if (!this.#headerelement) {
			console.error('grid cannot make widget, id="grid-el-header" is missing in template: ', this.#templateid);
		}
		
		let opts = { ...params.griditemoptions };
		if (!opts.w) { opts.w = 6; };
		if (!opts.h) { opts.h = 5; };
		opts.id = this.#uuid;
		
		if (!this.#grid.el.querySelector('#item'+this.#uuid)) {
			console.error('grid cannot make widget, id="item" is missing in template: ', this.#templateid);
		}
		
		this.#grid.makeWidget('item'+this.#uuid,opts);
		
	}
	
	init() {
		
	}
	
	toOwnFormat() {
		let res = {};
		
		res.griditemheader = this.headerText;
		res.uuid = this.uuid;
		res.griditemname = this.__proto__?.constructor?.name;
		
		return res;
	}
	
	get grid() {
		return this.#grid;
	}
	
	get uuid() {
		return this.#uuid;
	}
	
	
	get widgetName() {
		return this.__proto__?.constructor?.name
	}
	
	get bodyelement() {
		return this.#bodyelement;
	}
	
	get headerelement() {
		return this.#headerelement;
	}
	
	get headerText() {
		return this.#headerelement.querySelector('.griditemheadertext').textContent;
	}
	
	set headerText(newval) {
		this.#headerelement.querySelector('.griditemheadertext').textContent = newval;
	}
	
	get bodyElementSelector() {
		return '#' + this.#bodyelement.getAttribute('id');
	}
	
	get headerElementSelector() {
		return '#' + this.#headerelement.getAttribute('id');
	}
	
	setInnerHtml(text) {
		this.#bodyelement.innerHTML = text;
	}
	
	getElementByTemplateID(templateid) {
		return this.#grid.el.querySelector('#'+templateid+this.#uuid);
	}
	
	destroy() {
		// https://github.com/gridstack/gridstack.js/tree/master/doc#removewidgetel-removedom--true-triggerevent--true
		//~ removeWidget(el, removeDOM = true, triggerEvent = true)        // Removes widget from the grid.
		//~ el - widget to remove.
		//~ removeDOM - if false node won't be removed from the DOM (Optional. Default true).
		//~ triggerEvent if false (quiet mode) element will not be added to removed list and no 'removed' callbacks will be called (Default true).
		this.#grid.removeWidget('item'+this.#uuid);
	}
	
}

// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
// -------test classes----------------------------------------------


export class GridItemTabulator extends GridItem {
	#tabulatorObj;
	
	constructor (params) {
		super(params);
		
		this.tabulatorProperties = {
			//height:"100%", 
			movableRows:true,
			//reactiveData:true, 
			//index: "stepOrder",
			rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
			columns:[
				{
				  formatter: "rownum",
				  width: 20
				},
				{title:"stepOrder", field:"stepOrder", editor:false, headerSort:false,},
				{title:"Run status", field:"lastRunStatus", formatter:"tickCross", formatterParams:{ allowEmpty:true, allowTruthy:true, }, editor:false, headerSort:false, },
				{title:"Name", field:"srcDfActionName", editor:true, headerSort:false,},
				{title:"Type", field:"targetEnv", editor:true,headerSort:false,},
				{title:"Code", field:"scriptCode", editor:true,headerSort:false,formatter:"textarea",},
				{title:"Exec time", field:"executionTime", editor:false,headerSort:false,},
				

			],
			data:[
					{
						stepOrder: 0,
						srcDfActionId: "",
						srcDfActionName: "Import file",
						scriptCode: "file = pd.ExcelFile('/app/mount_dir/onlineretail2.xlsx')",
						targetEnv: "py",
						targetDataframe: "df",
						mutations: ["df","file"], 
						lastRunStatus: true,
						lastRunResult: "",
						executionTime: 0,
						stepactive: true,
					 },
					 {
						stepOrder: 1,
						srcDfActionId: "",
						srcDfActionName: "Import file as excel",
						scriptCode: "df = pd.read_excel(file,sheet_name='Sheet2', skiprows=0)",
						targetEnv: "py",
						targetDataframe: "df",
						mutations: ["df","file"], 
						lastRunStatus: undefined,
						lastRunResult: "",
						executionTime: 0,
						stepactive: true,
					 },
				],
		};
		
		this.#tabulatorObj = new Tabulator(this.bodyelement, this.tabulatorProperties);
	}
	
	
	init() {
		
	}
	
}

// -----------------------------------------------------------------------------------------
export class GridItemCodeEditor extends GridItem {
	#codeEditorObj;
	
	constructor (params) {
		super(params);
		
		this.#codeEditorObj = CodeMirror.fromTextArea(this.bodyelement.querySelector('.code-editor'), {
				mode: {name: "python",
					   version: 3,
					   singleLineStringErrors: false},
				lineNumbers: true,
				indentUnit: 4,
				matchBrackets: true,
				theme: "cobalt",
				autofocus: true,
				extraKeys: {
				  "Shift-Enter": function(cm) {
					//console.log("shift-enter pressed (codemirror)"); 
					evaluatePython("\n");
				  },
				  "Tab": function(cm) {
					var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
					cm.replaceSelection(spaces);
				  },
				  "Alt-A": "toggleComment"
				}
			});

	}
	
	
	init() {
		
	}
	
}
