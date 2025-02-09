/* -----------
 * Dataframe transforms 
 * Action sequences to run against python / sqlite? / duckdb?
 * 
 * ---------------*/
import { dfAction, getdfActionsArray } from "./dfaction.js";

// filesync as a separate step?

export const TransformStep = {
	stepOrder: 0,
	srcDfAction: {},
	scriptCode: "",
	targetEnv: "py",
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
	transformSteps: [{},{}],
	lastRunStepNum: 0,
	lastRunStatus: "success",
	lastRunResult: "",
	executionTime: 0,
};

/*----------
 * class TransformStepsControl
 * 
 * params.containerid -  container element
 * containertemplateid  - container of a html template
 * outputcodefunc(codetext,callback?) - call this to send codetext outside of control 
 * transformscript - transform steps object
 * 
 * 
 * --------*/
export class TransformStepsControl {
	#containerid;
	#containertemplateid;
	#internalContainer;
	#uuid;
	#outputcodefunc; 
	#getcodefunc; 
	#tabulatorObj;
	#transformscript;
	
	constructor(params) {
		this.#containerid=params.containerid;	
		this.#uuid = self.crypto.randomUUID();
		this.#internalContainer = document.querySelector(this.#containerid);
		this.#containertemplateid=params.containertemplateid;
		this.#outputcodefunc = params.outputcodefunc;
		this.#getcodefunc = params.getcodefunc;
		this.#transformscript = {...params.transformscript};
		
		const template = document.querySelector(this.#containertemplateid);
		const clone = template.content.cloneNode(true);
		clone.querySelector("#loadstepsfromdisk").id = "loadstepsfromdisk"+this.#uuid;
		clone.querySelector("#savestepstodisk").id = "savestepstodisk"+this.#uuid;
		clone.querySelector("#transformstable").id = "transformstable"+this.#uuid;
		clone.querySelector("#editasjson").id = "editasjson"+this.#uuid;
		clone.querySelector("#savepyscript").id = "savepyscript"+this.#uuid;
		clone.querySelector("#loadpyscript").id = "loadpyscript"+this.#uuid;
		
		this.#internalContainer.appendChild(clone);
		
		this.#internalContainer.querySelector("#loadstepsfromdisk"+this.#uuid).addEventListener("click", this.btnLoadStepsFromDiskClick.bind(this));
		this.#internalContainer.querySelector("#savestepstodisk"+this.#uuid).addEventListener("click", this.btnSaveStepsToDiskClick.bind(this));
		// editasjson  btnEditAsJsonClick
		// savepyscript btnSavePyScriptClick
		// loadpyscript  btnLoadPyScriptClick
		this.#internalContainer.querySelector("#editasjson"+this.#uuid).addEventListener("click", this.btnEditAsJsonClick.bind(this));
		this.#internalContainer.querySelector("#savepyscript"+this.#uuid).addEventListener("click", this.btnSavePyScriptClick.bind(this));
		this.#internalContainer.querySelector("#loadpyscript"+this.#uuid).addEventListener("click", this.btnLoadPyScriptClick.bind(this));
		
		
		this.tabulatorProperties = {
			height:"311px", 
			movableRows:true,
			reactiveData:true, 
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
			data:this.#transformscript.transformSteps,
		};
		
		this.#tabulatorObj = new Tabulator("#transformstable"+this.#uuid, this.tabulatorProperties);
		
		
	}
	
	btnLoadStepsFromDiskClick(e) {
		console.log("loadstepsfromdisk click");
	}
	
	btnSaveStepsToDiskClick(e) {
		console.log("savestepstodisk click");
	}
	
	btnEditAsJsonClick(e) {
		console.log("editasjson click");
		this.#outputcodefunc(JSON.stringify(this.#transformscript,null,4));
		
	}
	
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
		
		this.#outputcodefunc(pycode);
	}
	
	btnLoadPyScriptClick(e) {
		console.log("loadpyscript click");
		let pycode = this.#getcodefunc();
		//console.log("editor=", pycode);
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
	
	
	
	
}
