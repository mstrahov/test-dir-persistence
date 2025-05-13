/*******************
 * Grid item to be created in grid stack
 * Script (py/sql commands)
 * depends: bootstrap, codemirror
 *
 * 
 * ****************************/
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
	transformSteps: [{},{}],
	lastRunStepNum: 0,
	lastRunStatus: "success",
	lastRunResult: "",
	executionTime: 0,
};


export class gridItemScript extends GridItemWithMenu {
	
	constructor (params) {
		super(params);
	}
	
	
}
