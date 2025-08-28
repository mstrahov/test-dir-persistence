/*******************
 * Grid item to be created in grid stack
 * Script (py/sql commands)
 * depends: bootstrap, codemirror
 *
 * 
 * ****************************/
import { cmdAction, getcmdActionsArray } from "./cmdactiontemplates.js";
import { GridItemWithMenu } from "./griditemwithmenu.js";


export const TransformStep = {
	stepOrder: 0,
	targetEnv: "py",
	srccmdAction: {},
	scriptCode: "",
	stepID: "",
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
	//~ pyodideobject: undefined,
	//~ duckdbconn: undefined,
	filesdirectory: "/mount_dir",
	transformSteps: [],
	lastRunStepNum: 0,
	lastRunStatus: "success",
	lastRunResult: "",
	executionTime: 0,
};


export function TransformScriptInit() {
	return {
		scriptName : "New Script",
		scriptID:  self.crypto.randomUUID(),  
		srcfiles: [],
		destfiles: [],
		//~ pyodideobject: undefined,
		//~ duckdbconn: undefined,
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
		
		this.lastcolumnlayout = undefined;
		if (params.columnlayout) {
			try {
				this.lastcolumnlayout = JSON.parse(JSON.stringify(params.columnlayout));
			} catch (err) {
				console.warn("Error processing initial column layout",err);
			}
		}
		
		
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:true,
			reactiveData:true, 
			resizableRows: true,
			//~ resizableRowGuide:true,
			//~ resizableColumnGuide:true,
			index: "stepOrder",
			rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
			columns:[
				{
				  formatter: "rownum",
				  width: 20
				},
				{title:"stepOrder", field:"stepOrder", editor:false, headerSort:false,width:50,visible:true,},
				{title:"Run status", field:"lastRunStatus", formatter:"tickCross", formatterParams:{ allowEmpty:true, allowTruthy:true, }, editor:false, headerSort:false, width:50, },
				{title:"Name", field:"srccmdActionName", editor:true, headerSort:false, formatter:"textarea",width:90,},
				{title:"Type", field:"targetEnv", editor:true, headerSort:false,width:50,},
				{title:"Code", field:"scriptCode", editor:true, headerSort:false, formatter:"textarea",width:210,},
				{title:"Exec time", field:"executionTime", editor:false,headerSort:false, width:50,},
				

			],
			rowContextMenu:[
				{
					label:"Delete step",
					action:this.deleteOneStepRow.bind(this),
				},

				
			],
			data:this.#transformscript.transformSteps,
		};
		
		// ---------------------------- Restore last column widths
		if (this.lastcolumnlayout) {
			for (let i1=0;i1<this.tabulatorProperties.columns.length;i1++) {
				let oldlayout = this.lastcolumnlayout.find((e)=>e.title===this.tabulatorProperties.columns[i1].title);
				if (!oldlayout) {
					// do a second search in case column renamed, assume field name is the same
					oldlayout = this.lastcolumnlayout.find((e)=>e.field===this.tabulatorProperties.columns[i1].field);
				}
				if (oldlayout) {
					this.tabulatorProperties.columns[i1].width = oldlayout?.width;
				}
			}
		}
		// -----------------------------
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
	get transformscript() {
		return this.#transformscript;
	}
	// -----------------------------------------------------------------------------------------------------------
	
	get transformscriptclone() {
		let res = Object.assign({}, this.#transformscript, {transformSteps:[]});
		
		for (let i=0;i<this.#transformscript.transformSteps.length;i++){
			res.transformSteps.push({
				stepOrder: this.#transformscript.transformSteps[i].stepOrder,
				targetEnv: this.#transformscript.transformSteps[i].targetEnv,
				stepID: this.#transformscript.transformSteps[i].stepID,
				srccmdActionId: this.#transformscript.transformSteps[i].srccmdActionId,
				srccmdActionName: this.#transformscript.transformSteps[i].srccmdActionName,
				scriptCode: this.#transformscript.transformSteps[i].scriptCode,
				targetDataframe: this.#transformscript.transformSteps[i].targetDataframe,
				mutations: this.#transformscript.transformSteps[i].mutations, 
				lastRunStatus: this.#transformscript.transformSteps[i].lastRunStatus,
				lastRunResult: this.#transformscript.transformSteps[i].lastRunResult,
				executionTime: this.#transformscript.transformSteps[i].executionTime,
				stepactive: this.#transformscript.transformSteps[i].stepactive,
				
			});
		}
		
		return res;
	}
	
	// -----------------------------------------------------------------------------------------------------------
	
	async deleteOneStepRow(e, row) {
		
		const rowData = row.getData();
		let delIndex = this.#transformscript.transformSteps.findIndex((el)=>el.stepID===rowData?.stepID);
		if (delIndex>-1) {
			this.#transformscript.transformSteps.splice(delIndex,1);
		}
		
	}
	
	// -----------------------------------------------------------------------------------------------------------
	async menuEventHandler(obj,eventdata) {
		console.log("GridItemPyEditor widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "addpythonscriptstep") {
			await this.addScriptStep({actionid:'PythonScript', parameters:{df:"df"}});
			
		} else if (eventdata?.menuItemId === "addsqlscriptstep") {
			await this.addScriptStep({actionid:'SQLScript', parameters:{df:"df"}});
			
		} else if (eventdata?.menuItemId === "runcodeonestepaction") {
			await this.updateStepOrderBasedOnActualOrder();
			this.eventbus.dispatch('runonecodestepaction', this, {});
			
		} else if (eventdata?.menuItemId === "runallcodeaction") {
			await this.updateStepOrderBasedOnActualOrder();
			this.eventbus.dispatch('runallcodestepsaction', this, {});
			
		} else if (eventdata?.menuItemId === "syncaction") {
			let pycode = await this.convertScriptToPyCode();
			this.eventbus.dispatch('showscriptaspythoneditable', this, {pycode: pycode,});
			
		} else if (eventdata?.menuItemId === "exportasjson") {
			
		} else if (eventdata?.menuItemId === "editaspythonscript") {
			let pycode = await this.convertScriptToPyCode();
			this.eventbus.dispatch('showscriptaspythoneditable', this, {pycode: pycode,});
			
		} else if (eventdata?.menuItemId === "loadfrompythonscript") {
			this.eventbus.dispatch('loadfrompythonscript', this, {});
			
		}  else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, {});
		}
		
	}
	
	// -----------------------------------------------------------------------------------------------------------
	
	async updateStepOrderBasedOnActualOrder() {
		let rows = this.#tabulatorObj.getRows();
		for (let i=0;i<rows.length;i++) {
			if (rows[i].getPosition()>0) {
				await rows[i].update({"stepOrder":rows[i].getPosition()});	
			}
		}
	}
	
	// -----------------------------------------------------------------------------------------------------------
	async addScriptStep(stepdata) {
			let newaction = new cmdAction(stepdata);
			let newstep = {
				//rownum: this.#transformscript.transformSteps.length+1,
				stepOrder: this.#transformscript.transformSteps.length+1,
				targetEnv: newaction.actionTemplateObj.targetEnv,
				stepID: self.crypto.randomUUID(),
				srccmdActionId: stepdata.actionid,
				srccmdActionName: newaction.actionTemplateObj.name,
				scriptCode: newaction.cmdcode(),
				targetDataframe: stepdata.parameters.df,
				mutations: [stepdata.parameters.df], 
				lastRunStatus: null,
				lastRunResult: "",
				executionTime: 0,
				stepactive: true,
				
			};
			
			// first update steporders to sync with actual row moves
			await this.updateStepOrderBasedOnActualOrder();
			
			// tabulator is set as reactive here, so it adds a new row on push
			this.#transformscript.transformSteps.push(newstep);
			
			
	}
	
	// -----------------------------------------------------------------------------------------------------------
	

	btnEditAsJsonClick(e) {
		console.log("editasjson click");
		//this.#outputcodefunc(JSON.stringify(this.#transformscript,null,4));
		
	}
	// -----------------------------------------------------------------------------------------------------------
	async convertScriptToPyCode() {
		console.log("savepyscript click");
		const scriptheader = { ...this.#transformscript, transformSteps: undefined };
		let pycode = '#---script: ' + JSON.stringify(scriptheader) + "\n";
		
		await this.updateStepOrderBasedOnActualOrder();
				
		let scriptsteps = this.#transformscript.transformSteps;
		scriptsteps.sort((a,b)=>a.stepOrder-b.stepOrder);
		for (let i=0;i<scriptsteps.length;i++) {
			pycode += '#---step '+i+':'+JSON.stringify({ ...scriptsteps[i], scriptCode: undefined }) + "\n";
			if (scriptsteps[i].targetEnv==="py") {
				pycode += scriptsteps[i].scriptCode + "\n";
			} else {
				pycode += '"""' + scriptsteps[i].scriptCode + '"""' + "\n";
			}
		}
		
		return pycode;

	}
	// -----------------------------------------------------------------------------------------------------------
	async loadScriptFromPyCode(pycode) {
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
				if (stepobj.targetEnv==="sql") {
					stepobj.scriptCode = stepobj.scriptCode.replaceAll('"""','');
				}
				console.log("step obj=",stepobj);
				newstepsarray.push(stepobj);
			}
			this.#transformscript.transformSteps = [...newstepsarray];
			await this.#tabulatorObj.setData(this.#transformscript.transformSteps);
				
		} else {
			console.log("Not a script");
		}
	}
	
	// -----------------------------------------------------------------------------------------------------------
	
	async destroytabulatorobj() {		
		let that = this;
		return new Promise((resolve, reject) => {
			if (this.#tabulatorObj) {
				try {
					that.#tabulatorObj.on("tableDestroyed", ()=>{
						that.#tabulatorObj = null;
						resolve();
					});
					that.#tabulatorObj.clearData();
					that.#tabulatorObj.setData([]).then(()=>{ that.#tabulatorObj.destroy();});
				} catch (err) { 
					console.error(err);
					reject(err); 
				}
			} else {
				resolve();
			}
		})
	}
	// -------------------------------------------------------------------------
	
	async destroy() {
		//~ if (this.#tabulatorObj) {
			//~ try {
				//~ this.#tabulatorObj.destroy();
			//~ } catch (err) { console.error(err); }
		//~ }
		//~ super.destroy();
		
		await this.destroytabulatorobj();
		await super.destroy();
	}
	
	// -------------------------------------------------------------------------
	
	toOwnFormat() {
		let res = super.toOwnFormat();
		// -----------
		//~ if (this.lastcolumnlayout) {
			//~ let oldlayout = this.lastcolumnlayout.find((e)=>e.field==="df_row_index");
			//~ if (oldlayout) {
				//~ colwidth = oldlayout?.width;
			//~ }
		//~ }
		
		res.transformscript = this.transformscriptclone;
		res.scriptname = this.#scriptname;
		// ------------
		try {
			res.columnlayout = this.#tabulatorObj.getColumnLayout();
		} catch (e) {  console.warn("Column layout save error",e);  }
				
		return res;
	}
	
	
	// -----------------------------------------------------------------------------------------------------------
	
}


// ====================================================================

