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
