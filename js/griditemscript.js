/*******************
 * Grid item to be created in grid stack
 * Script (py/sql commands)
 * depends: bootstrap, codemirror
 *
 * 
 * ****************************/
import { dfAction, getdfActionsArray } from "./dfaction.js";
import { GridItemWithMenu } from "./griditemwithmenu.js";


export const TransformStep = {
	stepOrder: 0,
	targetEnv: "py",
	srcDfAction: {},
	scriptCode: "",
	targetDataframe: "df",
	mutations: ["df","file"], 
	lastRunStatus: undefined,
	lastRunResult: "",
	executionTime: 0,
	stepactive: true,
};

//  methods: toJson(), load from json
export const TransformScript = {
	srcfiles: [],
	destfiles: [],
	pyodideobject: undefined,
	duckdbconn: undefined,
	filesdirectory: "/mount_dir",
	transformSteps: [],
	lastRunStepNum: 0,
	lastRunStatus: "success",
	lastRunResult: "",
	executionTime: 0,
};


export function TransformScriptInit() {
	return {
		srcfiles: [],
		destfiles: [],
		pyodideobject: undefined,
		duckdbconn: undefined,
		filesdirectory: "",
		transformSteps: [],
		lastRunStepNum: 0,
		lastRunStatus: "",
		lastRunResult: "",
		executionTime: 0,
	}
}




export class gridItemScript extends GridItemWithMenu {
	#transformscript;
	#scriptname;
	#tabulatorObj;
	
	constructor (params) {
		super(params);
		this.#transformscript = {...params.transformscript};
		this.#scriptname = params.scriptname;
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:true,
			reactiveData:true, 
			index: "stepOrder",
			rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
			columns:[
				{
				  formatter: "rownum",
				  width: 20
				},
				{title:"stepOrder", field:"stepOrder", editor:false, headerSort:false,width:50,visible:true,},
				{title:"Run status", field:"lastRunStatus", formatter:"tickCross", formatterParams:{ allowEmpty:true, allowTruthy:true, }, editor:false, headerSort:false, width:50, },
				{title:"Name", field:"srcDfActionName", editor:true, headerSort:false, formatter:"textarea",width:90,},
				{title:"Type", field:"targetEnv", editor:true,headerSort:false,width:50,},
				{title:"Code", field:"scriptCode", editor:true, headerSort:false, formatter:"textarea",width:210,},
				{title:"Exec time", field:"executionTime", editor:false,headerSort:false, width:50,},
				

			],
			data:this.#transformscript.transformSteps,
		};
		
		this.#tabulatorObj = new Tabulator("#grid-el-body"+this.uuid, this.tabulatorProperties);
		
		this.#tabulatorObj.on("rowAdded", function(row){
			// row - row component
			// tabulator.js does not set rownum correctly (appears as 0), so need to call row.move() as a workaround for the last row
			const tlen = row.getTable().getRows().length;
			if (tlen>0) {
				row.move(tlen-1, false);
			}

		});
		this.#tabulatorObj.on("rowDeleted", function(row){
			//row - row component
		});
		this.#tabulatorObj.on("rowMoved", function(row){
			//row - row component
		});
		
		
	}
	// -----------------------------------------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		console.log("GridItemPyEditor widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "addpythonscriptstep") {
			this.addScriptStep({actionid:'PythonScript', parameters:{df:"df"}});
		} else if (eventdata?.menuItemId === "addsqlscriptstep") {
			
		} else if (eventdata?.menuItemId === "cleareditorgriditem") {
			
		} else if (eventdata?.menuItemId === "prevcommandmenuitem") {
			
		} else if (eventdata?.menuItemId === "nextcommandmenuitem") {
			
		} else if (eventdata?.menuItemId === "runselectedcommandmenuitem") {
			
		} else if (eventdata?.menuItemId === "runcommandmenuitem") {
			
		} else if (eventdata?.menuItemId === "dumpallhistory") {
			
		}
		
	}
	
	// -----------------------------------------------------------------------------------------------------------
	addScriptStep(stepdata) {
			let newaction = new dfAction(stepdata);
			let newstep = {
				//rownum: this.#transformscript.transformSteps.length+1,
				stepOrder: this.#transformscript.transformSteps.length+1,
				srcDfActionId: stepdata.actionid,
				srcDfActionName: newaction.actionTemplateObj.name,
				scriptCode: newaction.pycode(),
				targetEnv: "py",
				targetDataframe: stepdata.parameters.df,
				mutations: [stepdata.parameters.df], 
				lastRunStatus: undefined,
				lastRunResult: "",
				executionTime: 0,
				stepactive: true,
				
			};
			
			// first update steporders to sync with actual row moves
			let rows = this.#tabulatorObj.getRows();
			for (let i=0;i<rows.length;i++) {
				if (rows[i].getPosition()>0) {
					rows[i].update({"stepOrder":rows[i].getPosition()});	
				}
			}
			
			// tabulator is set as reactive here, so it adds a new row on push
			this.#transformscript.transformSteps.push(newstep);
			
			
	}
	
	// -----------------------------------------------------------------------------------------------------------
	

	btnEditAsJsonClick(e) {
		console.log("editasjson click");
		//this.#outputcodefunc(JSON.stringify(this.#transformscript,null,4));
		
	}
	// -----------------------------------------------------------------------------------------------------------
	btnSavePyScriptClick(e) {
		console.log("savepyscript click");
		const scriptheader = { ...this.#transformscript, transformSteps: undefined };
		let pycode = '#---script: ' + JSON.stringify(scriptheader) + "\n";
		
		const rows = this.#tabulatorObj.getRows();
		for (let i=0;i<rows.length;i++) {
				rows[i].update({"stepOrder":rows[i].getPosition()});	
		}
				
		
		//let scriptsteps = this.#tabulatorObj.getData();
		// this.#transformscript.transformSteps
		let scriptsteps = this.#transformscript.transformSteps;
		scriptsteps.sort((a,b)=>a.stepOrder-b.stepOrder);
		for (let i=0;i<scriptsteps.length;i++) {
			pycode += '#---step '+i+':'+JSON.stringify({ ...scriptsteps[i], scriptCode: undefined }) + "\n";
			pycode += scriptsteps[i].scriptCode + "\n";
		}
		
		//this.#outputcodefunc(pycode);
	}
	// -----------------------------------------------------------------------------------------------------------
	btnLoadPyScriptClick(pycode) {
		console.log("loadpyscript click");
		//let pycode = this.#getcodefunc();
		pycode +='#---step';
		const re = /#-+step +\d+:((.|\n)*?)(?=(#-+step))/gmi;
		const stepsarr = pycode.match(re);
		let newstepsarray = [];	
		if (stepsarr!==null) {
			
			for (let i=0;i<stepsarr?.length;i++) {
				//console.log(stepsarr[i]);
				const cmdlines = stepsarr[i].split("\n");
				console.log("cmdlines",cmdlines);
				const re_json1 = /#-+step +\d+:(.+)/gi;
				let stepobj = {};
				stepobj.scriptCode = '';
				
				for (let j=0;j<cmdlines.length;j++) {
					const jsonfound = [...cmdlines[j].matchAll(re_json1)];
					//console.log("inner json:",jsonfound[0],jsonfound[0].length);
					if (jsonfound.length>0&&jsonfound[0].length>1) {
						//console.log("inner json:",jsonfound[0][1]);
						try { 
							let stepobjfromjson = JSON.parse(jsonfound[0][1]);
							stepobj = {...stepobjfromjson};
							stepobj.scriptCode = '';
						} catch(e) {
							console.log('error parsing json for a step:',e,jsonfound[0][1]);
						}
					} else {
						//  treat current line as py script
						 
						
						if ((j<(cmdlines.length-1))||(j===(cmdlines.length-1)&&cmdlines[j].length>0)) {
							if (stepobj.scriptCode.length>0) {
								stepobj.scriptCode += "\n";
							} 
							stepobj.scriptCode += cmdlines[j];
						} 
					}	
				}
				// todo:  verify all fields of stepobj???
				console.log("step obj=",stepobj);
				newstepsarray.push(stepobj);
			}
			this.#transformscript.transformSteps = [...newstepsarray];
			this.#tabulatorObj.setData(this.#transformscript.transformSteps);
				
		} else {
			console.log("not a script");
		}
	}
	
	// -----------------------------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------------------------
	
}


// ====================================================================

