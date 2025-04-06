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
	
	constructor (params) {
		this.#templateid = params.templateid;
		this.#grid = params.grid;
		this.#uuid = self.crypto.randomUUID();
		
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		clone.querySelector('#grid-el-header'+this.#uuid).querySelector('.griditemheadertext').textContent = params.headertext;
		//--------------------
		this.#grid.el.appendChild(clone);
		this.#bodyelement= this.#grid.el.querySelector('#grid-el-body'+this.#uuid);
		let opts = {
			w: 3,
			h: 3,
			id : this.#uuid,
		}
		
		this.#grid.makeWidget('item'+this.#uuid,opts);
		
	}
	
	get grid() {
		return this.#grid;
	}
	
	get uuid() {
		return this.#uuid;
	}
	
	get bodyelement() {
		return this.#bodyelement;
	}
	
	get bodyElementSelector() {
		return '#' + this.#bodyelement.getAttribute('id');
	}
	
	setInnerHtml(text) {
		this.#bodyelement.innerHTML = text;
	}
	
}


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
