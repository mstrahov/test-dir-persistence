/**********************************
 * gridItemStaticQueryTreeView
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */


import { GridItemWithMenu } from "./griditemwithmenu.js";
import { ExecTimer } from "./exectimer.js"; 
import { gridItemQueryView, arrowDataTypesToTabulatorCols } from "./griditemqueryview.js";

export class gridItemStaticQueryTreeView extends gridItemQueryView {
	#internalContainer;
	#defer;
	#resolve;
	#reject;
	
	constructor (params) {
		super(params);	
		this.displaymode = this._DATATREE;  
		this.groupFieldsList = [];
	}
	

	async refreshData() {
	
		if (!this.sqlcommand) {
			return false;
		}
		
		let escapedSqlCmd = this.sqlcommand.replaceAll("'","''");
		// need to find this._dataTreeElementColumn ?
		if (!this.groupFieldsList || this.groupFieldsList.length==0) {
			
			let analyzeSqlCmd = `select json_serialize_sql('${escapedSqlCmd}')->'$.statements[*].*.group_expressions[*].column_names[*]' as r1;`;
			let resAnalyze = await this.coderunner.runSQLAsync(analyzeSqlCmd);
			if (!resAnalyze?.runStatus) {
				console.error("Tree query view update error during query analysis:", resAnalyze.error);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:analyzeSqlCmd, result: resAnalyze });
				return false;
			}
			try {
				this.groupFieldsList = JSON.parse(resAnalyze.output);
				// if not Array.isArray				
			} catch (err) {
				console.error("Tree query view group fields parsing error:", err);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:resAnalyze.output, result: resAnalyze });
				return false;
			}
		}
		
		//  select json_deserialize_sql(json_serialize_sql(`${escapedSqlCmd}`)) as r1;
		
		let strAllFields = this.groupFieldsList.join();
		// if no GROUPING_ID ?? - guess have to have it or attempt to insert after the last select??
		// find the last group by.  s1.substr(0,s1.lastIndexOf('GROUP BY')) + 'GROUP BY ' + ....
		// index of grouping s1.indexOf('GROUPING(')
		// closing par - s1.indexOf(') ',s1.indexOf('GROUPING('))
		// new grouping contents:
		/*
		s1.substr(s1,s1.indexOf('GROUPING('))+ 'GROUPING(' + ..... + s1.substr(s1.indexOf(') ',s1.indexOf('GROUPING(')))
		*/
		let modifiedSql = this.sqlcommand;
		
		const res = await this.coderunner.runSQLAsync(modifiedSql);
		if (res?.runStatus) {
			await this.showQueryResult(res.output);
		} else {
			console.error("Tree query view update error:", res.error);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd: modifiedSql, result: res });
			
		}
		
	}

	// -------------------------------------------------------------------------
	//~ generateColumnDefinitions(arrowdata) {
		
	//~ }
	// -------------------------------------------------------------------------
	generateTableData(arrowdata) {
		let resArray = [];
		// **********
		
		if (!arrowdata.schema.fields[0].fldname) {
			let fldcount = {};
			for (let i=0;i<arrowdata.numCols;i++) {
				// ****  check if field name is repeated, add number at the end to make field names unique
				fldcount[arrowdata.schema.fields[i].name] = (fldcount[arrowdata.schema.fields[i].name] || 0) + 1;
				if (fldcount[arrowdata.schema.fields[i].name]>1) {
					let newfldname = `${arrowdata.schema.fields[i].name}_${fldcount[arrowdata.schema.fields[i].name]}`;
					const newfldname0 = newfldname+'_';
					let newnamecnt = 1;
					while (fldcount[newfldname] && newnamecnt<1000) {
						newfldname = newfldname0 + newnamecnt;
						newnamecnt++;
					}
					fldcount[newfldname] = 1;
					arrowdata.schema.fields[i].fldname = newfldname;
					console.log("Replaced field name: ", arrowdata.schema.fields[i].name, arrowdata.schema.fields[i].fldname);
				} else {
					arrowdata.schema.fields[i].fldname = arrowdata.schema.fields[i].name;
				}
			}
		}
		
		// **********
		for (let i=0;i<arrowdata.numRows;i++) {
			let newrow = { "_row_index": i };
			// [...arrowdata.get(i)]   --->  [Array(2), Array(2)] 
			const vals = [...arrowdata.get(i)];
			for (let j=0;j<arrowdata.schema.fields.length;j++) {
				newrow[arrowdata.schema.fields[j].fldname] = vals[j][1]; 
			}
			//~ arrowdata.schema.fields.forEach((f)=>{
				
				//~ newrow[f.name]=''+arrowdata.get(i)[f.name];
			//~ });
			resArray.push(newrow);
		}
		// **********
		return resArray;
	}
	// -------------------------------------------------------------------------
	
	
	// ------------------------------------
	
	//~ async applyColumnLayout(newColumnLayout) {
			
	//~ }
	
	// ------------------------------------

	
}

