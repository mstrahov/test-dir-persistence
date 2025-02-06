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
	lastRunStatus: "success",
	lastRunResult: "",
	executionTime: 0,
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

export class TransformStepsControl {
	#containerid;
	#containertemplateid;
	#internalContainer;
	#uuid;
	constructor(params) {
		this.#containerid=params.containerid;	
		this.#uuid = self.crypto.randomUUID();
		this.#internalContainer = document.querySelector(this.#containerid);
		this.#containertemplateid=params.containertemplateid;
		const template = document.querySelector(this.#containertemplateid);
		const clone = template.content.cloneNode(true);
		clone.querySelector("#loadstepsfromdisk").id = "loadstepsfromdisk"+this.#uuid;
		clone.querySelector("#savestepstodisk").id = "savestepstodisk"+this.#uuid;
		clone.querySelector("#transformstable").id = "transformstable"+this.#uuid;
		
		this.#internalContainer.appendChild(clone);
		
		this.#internalContainer.querySelector("#loadstepsfromdisk"+this.#uuid).addEventListener("click", this.btnLoadStepsFromDiskClick.bind(this));
		this.#internalContainer.querySelector("#savestepstodisk"+this.#uuid).addEventListener("click", this.btnSaveStepsToDiskClick.bind(this));
		
		this.tabulatorProperties = {
			height:"311px", 
			movableRows:true,
			rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
			columns:[
				{title:"Name", field:"srcDfActionName", editor:true, headerSort:false,},
				{title:"Status", field:"lastRunStatus", editor:true,headerSort:false,},
				{title:"Type", field:"targetEnv", editor:true,headerSort:false,},
				{title:"Code", field:"scriptCode", editor:true,headerSort:false,formatter:"textarea",},
				{title:"Exec time", field:"executionTime", editor:false,headerSort:false,},
			],
			data:[
				{
				stepOrder: 0,
				srcDfActionId: "",
				srcDfActionName: "Import file",
				scriptCode: "file = pd.ExcelFile('/mount_dir/onlineretail2.xlsx')",
				targetEnv: "py",
				targetDataframe: "df",
				mutations: ["df","file"], 
				lastRunStatus: "success",
				lastRunResult: "",
				executionTime: 0,
			 },
			 {
				stepOrder: 1,
				srcDfActionId: "",
				srcDfActionName: "Import file as excel",
				scriptCode: "df = pd.read_excel(file,sheet_name='Sheet2', skiprows=0)",
				targetEnv: "py",
				targetDataframe: "df",
				mutations: ["df","file"], 
				lastRunStatus: "success",
				lastRunResult: "",
				executionTime: 0,
			 },
			],
		};
		
		this.tabulatorObj = new Tabulator("#transformstable"+this.#uuid, this.tabulatorProperties);
		
		
	}
	
	btnLoadStepsFromDiskClick(e) {
		console.log("loadstepsfromdisk click");
	}
	
	btnSaveStepsToDiskClick(e) {
		console.log("savestepstodisk click");
	}
	
}
