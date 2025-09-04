/**********************************
 * gridItemStaticQueryTreeView
 * depends: Tabulator.js
 * 
 * 
 ***********************************   */
// https://www.npmjs.com/package/@shopify/draggable/v/1.1.4?activeTab=readme
// https://cdn.jsdelivr.net/npm/@shopify/draggable@1.1.4/build/
// https://github.com/Shopify/draggable
//  /home/misha/work/dev/analysis_project2/v_demo4/js/monitorlib.js 

import Swappable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable@1.1.4/build/esm/Swappable/Swappable.mjs';

import { GridItemWithMenu } from "./griditemwithmenu.js";
import { ExecTimer } from "./exectimer.js"; 
import { gridItemQueryView, arrowDataTypesToTabulatorCols } from "./griditemqueryview.js";

export class gridItemStaticQueryTreeView extends gridItemQueryView {
	
	constructor (params) {
		super(params);	
		this.displaymode = this._DATATREE;  
		this.groupFieldsList = [];
		this.groupFieldPosMap = new Map();
		this.swappable = null;
		this.sqlNormalized = null;
		this.groupingIDFieldName = '';
		this.eventbus.subscribe('_internal_refresh_action',this.refreshData.bind(this));
	}
	

	async refreshData() {
	
		if (!this.sqlcommand) {
			return false;
		}
		
		let escapedSqlCmd = this.sqlcommand.replaceAll("'","''");
		// need to find this._dataTreeElementColumnName ?
		if (!this.groupFieldsList || this.groupFieldsList.length==0) {
			
			let analyzeSqlCmd = `select json_serialize_sql('${escapedSqlCmd}')->'$.statements[*].*.group_expressions[*].column_names[*]' as f1;`;
			let resAnalyze = await this.coderunner.runSQLAsync(analyzeSqlCmd);
			if (!resAnalyze?.runStatus) {
				console.error("Tree query view update error during query analysis:", resAnalyze.error);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:analyzeSqlCmd, result: resAnalyze });
				return false;
			}
			try {
				this.groupFieldsList = JSON.parse(resAnalyze.output?.get(0)['f1']);
				// if not Array.isArray				
			} catch (err) {
				console.error("Tree query view group fields parsing error:", err);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:resAnalyze.output, result: resAnalyze });
				return false;
			}
		}
		
		if (!this.groupFieldsList || this.groupFieldsList.length===0) {
			console.error("Tree query view error: no GROUP BY in SQL Statement");
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', msg: '', result: null });
			return false;
		}
		
		if (!this.swappable) this.updateGroupFieldsControl();
		
		for (let i=0;i<this.groupFieldsList.length;i++) { this.groupFieldsList[i] = '"'+ this.groupFieldsList[i] +'"'}
		console.log("Group fields list:",this.groupFieldsList);
		
		
		if (!this.sqlNormalized) {
			//  select json_deserialize_sql(json_serialize_sql(`${escapedSqlCmd}`)) as f1;
			let analyzeSqlCmd = `select json_deserialize_sql(json_serialize_sql('${escapedSqlCmd}')) as f1;`;
			let resAnalyze = await this.coderunner.runSQLAsync(analyzeSqlCmd);
			if (!resAnalyze?.runStatus) {
				console.error("Tree query sql query analysis error:", resAnalyze.error);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:analyzeSqlCmd, result: resAnalyze });
				return false;
			}
			try {
				this.sqlNormalized = resAnalyze.output?.get(0)['f1'];
				// if not Array.isArray				
			} catch (err) {
				console.error("Tree query sql query analysis error:", err);
				this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd:resAnalyze.output, result: resAnalyze });
				return false;
			}
		}
		
		console.log("Normalized SQL:",this.sqlNormalized);	
		
		if (!this.sqlNormalized.includes('GROUPING(')) {
			console.error("Tree query view error: GROUPING_ID() field in SQL Statement");
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', msg: '', result: null });
			return false;
		}
		
		let strAllFields = this.groupFieldsList.join();
		// if no GROUPING_ID ?? - guess have to have it or attempt to insert after the last select??
		// find the last group by.  s1.substr(0,s1.lastIndexOf('GROUP BY')) + 'GROUP BY ' + ....
		// index of grouping s1.indexOf('GROUPING(')
		// closing par - s1.indexOf(') ',s1.indexOf('GROUPING('))
		// new grouping contents:
		/*
		s1.substr(s1,s1.indexOf('GROUPING('))+ 'GROUPING(' + ..... + s1.substr(s1.indexOf(') ',s1.indexOf('GROUPING(')))
		*/
		let s1 = this.sqlNormalized;
		// grouping_id() function should have 'as name' alias in query
		//this.groupingIDFieldName = s1.substr(s1.indexOf('AS',s1.indexOf('GROUPING('))+3,s1.indexOf(',',s1.indexOf('AS',s1.indexOf('GROUPING(')))-s1.indexOf('AS',s1.indexOf('GROUPING('))-3);
		this.groupingIDFieldName = s1.substr(s1.indexOf('AS',s1.indexOf('GROUPING('))+3,s1.indexOf(' ',s1.indexOf('AS',s1.indexOf('GROUPING('))+3)-s1.indexOf('AS',s1.indexOf('GROUPING('))-3).replace(',','');
		s1 = s1.substr(s1,s1.indexOf('GROUPING('))+ 'GROUPING(' + strAllFields + s1.substr(s1.indexOf(') ',s1.indexOf('GROUPING(')));
		s1 = s1.substr(0,s1.lastIndexOf('GROUP BY')) + 'GROUP BY GROUPING SETS (';
		for (let i=0;i<this.groupFieldsList.length;i++) {
			s1 = s1 + '(' + this.groupFieldsList.slice(0,i+1).join() + '),';
		}
		s1 = s1 + ')  ORDER BY ' + strAllFields + ', ' + this.groupingIDFieldName + ';';
		
		console.log("Modified sql: ",s1);
		for (let i=0;i<this.groupFieldsList.length;i++) { this.groupFieldsList[i] = this.groupFieldsList[i].replaceAll('"','') }
		console.log("Group fields list:",this.groupFieldsList);
		
		this.addTreeColumnToUserColumnLayout();
		
		const res = await this.coderunner.runSQLAsync(s1);
		if (res?.runStatus) {
			await this.showQueryResult(res.output);
		} else {
			console.error("Tree query view update error:", res.error);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', cmd: modifiedSql, result: res });
			
		}
		
	}
	
	
	// -------------------------------------------------------------------------
	
	updateGroupFieldsControl() {
		
		if (!this.groupFieldsList) return false;
		
		let fieldsContainerElement = this.headerelement.querySelector('#groupfieldscontainer'+this.uuid);
		if (!fieldsContainerElement) {
			console.error('#groupfieldscontainer element not found, cannot build a field list control');
			return false;
		}
		if (this.swappable) {this.swappable.destroy();}
		while(fieldsContainerElement.firstChild) fieldsContainerElement.removeChild(fieldsContainerElement.firstChild);
		for (let i=0;i<this.groupFieldsList.length;i++) {
			// <button type="button" class="btn btn-outline-info">Left</button>
			const layoutInd = this.usercolumnlayout.findIndex(v=>v.field===this.groupFieldsList[i]);
			let buttonID = 'groupField_' + this.groupFieldsList[i] + this.uuid;
			let buttonText = this.groupFieldsList[i];
			if (layoutInd>-1 && this.usercolumnlayout[layoutInd].title) {
				buttonText = this.usercolumnlayout[layoutInd].title;
			}
			let el = document.createElement("button");
			let classNames = "btn btn-outline-info".split(" ");
			classNames.forEach((className) => {
				el.classList.add(className);
			});
			el.id = buttonID;
			el.setAttribute("type", "button");
			el.setAttribute("data-bs-toggle", "tooltip");
			el.setAttribute("data-bs-placement", "top");
			el.setAttribute("title", "Move to change grouping order");
			//el.style.fontWeight = "bolder";
			el.innerText = buttonText;
			fieldsContainerElement.appendChild(el);
			this.groupFieldPosMap.set(buttonID,{position: i, title: buttonText, field: this.groupFieldsList[i]});
		}
		
		
		this.swappable = new Swappable(fieldsContainerElement, {  draggable: 'button' });
		this.swappable.on('swappable:stop', this.swappablestopevent.bind(this));

	}
	// -------------------------------------------------------------------------
	swappablestopevent(e) {
		//console.log('swappable:stop');
		//console.log(e);
		//console.log("Internal cont = ",this);
		let fieldsContainerElement = this.headerelement.querySelector('#groupfieldscontainer'+this.uuid);
		if (!fieldsContainerElement) {
			console.error('#groupfieldscontainer element not found, cannot build a field list control');
			return false;
		}
		let newpath = [];
		let nochanges = true;
		let j=0;
		for (let i=0;i<fieldsContainerElement.children.length;i++) {
			if (fieldsContainerElement.children.item(i).style.display!=='none'&&fieldsContainerElement.children.item(i).style.position!=='fixed') {
				let fieldid = fieldsContainerElement.children.item(i).id;
				//console.log(fieldid);
				//console.log(this.groupFieldPosMap.get(fieldid),j);
				
				let groupField = this.groupFieldPosMap.get(fieldid);
				nochanges = nochanges && (groupField.position===j);
				newpath.push(groupField.field);
				if (groupField.position!==j) {
					groupField.position = j;
					this.groupFieldPosMap.set(fieldid, groupField);
				}
				j++;
			}
		}
		if (!nochanges) {
			console.log('Grouping order changed!!!', newpath);
			this.groupFieldsList = [...newpath];
			this.eventbus.dispatch('_internal_refresh_action', this, { });
		}
		
		
	}
	
	// -------------------------------------------------------------------------
	addTreeColumnToUserColumnLayout() {
		// add this._dataTreeElementColumnName to this.usercolumnlayout
		
		if (!this.usercolumnlayout) { return false; }
		
		const treeColPresent = this.usercolumnlayout.findIndex(v=>v.field===this._dataTreeElementColumnName)>-1;
		if (treeColPresent) { return true; }
		
		let newcolumn = {
			title: "",
			field: this._dataTreeElementColumnName,
			width: 250,
			hozAlign: "left",
			sorter: "string",
			headerSortTristate:true,
			formatter: "plaintext",
			frozen:true, 
			contextMenu: this.defaultCellContextMenu,
			visible: true,
		};
			
		if (this.headerContextMenuGeneratorFunction) {
			newcolumn.headerContextMenu = this.headerContextMenuGeneratorFunction;
		}
		if (this.cellContextMenuGeneratorFunction) {
			newcolumn.contextMenu = this.cellContextMenuGeneratorFunction;
		}
		
		for (let i=0;i<this.groupFieldsList.length;i++) {
			const layoutInd = this.usercolumnlayout.findIndex(v=>v.field===this.groupFieldsList[i]);
			if (layoutInd>-1) {
				this.usercolumnlayout[layoutInd].visible = false;
			}
		}
		
		let layoutInd = this.usercolumnlayout.findIndex(v=>v.field==="_row_index");
		if (layoutInd>-1) {
			this.usercolumnlayout[layoutInd].visible = false;
		}
		
		layoutInd = this.usercolumnlayout.findIndex(v=>v.field===this.groupingIDFieldName);
		if (layoutInd>-1) {
			this.usercolumnlayout[layoutInd].visible = false;
		}
		
		this.usercolumnlayout.unshift(newcolumn);
		
		return true;
	}
	
	// -------------------------------------------------------------------------
	generateTableData(arrowdata) {
		let resArray = [];
		
		if (arrowdata.numRows===0) {
			return resArray;
		} 
		
		if (!this.groupFieldsList || this.groupFieldsList.length===0) {
			return super.generateTableData(arrowdata);
		}
		
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
		
		// [a,b,c,d], len=4
		// (1<<3)-1 = grouping_id()=7
		// from grouping id: Math.log2(7+1)+1 = 4
		//groupsarr : '[0:{"level":3, namefieldindex:"d"}, 1: {"level":2, namefieldindex:"c"},null, 3: {"level":1, namefieldindex:"b"},null,null,null,7:{"level":0, namefieldindex:"a"}]'
		
		
		const groupingIDIndex=arrowdata.schema.fields.findIndex(v=>v.fldname===this.groupingIDFieldName);
		let groupsArr = [];
		let maxLevel = this.groupFieldsList.length-1;
		for (let i=0;i<this.groupFieldsList.length;i++) {
			const groupingIndex = (1<<(this.groupFieldsList.length-i-1))-1;
			const nameIndex = arrowdata.schema.fields.findIndex(v=>v.fldname===this.groupFieldsList[i]);			
			groupsArr[groupingIndex] = { level:i, namefieldindex: nameIndex };
		}
		
		console.log('GROUPS ARRAY: ', groupsArr);

		// **********
		
		let that = this;
		function processDataRow(rowNum,myLevel,curRowValues) {
			let res = {
				rowsArr: [],
				curRowNum: 0,
				curRowValues: []
			};
			let vals = curRowValues;
			let curRowNum = rowNum;
			let curRowLevel = groupsArr[vals[groupingIDIndex][1]].level;
			
			while (curRowNum<arrowdata.numRows && curRowLevel>=myLevel) {
				let newrow = { _level: myLevel, };
				if (curRowLevel>myLevel) {
					let processResult = processDataRow(curRowNum,myLevel+1,vals);
					newrow['_children'] = processResult.rowsArr;
					curRowNum = processResult.curRowNum;
					vals = processResult.curRowValues;
				}
				
				if (curRowNum<arrowdata.numRows) {
					newrow[that._dataTreeElementColumnName] = vals[groupsArr[vals[groupingIDIndex][1]].namefieldindex][1];
					for (let j=0;j<arrowdata.schema.fields.length;j++) {
						newrow[arrowdata.schema.fields[j].fldname] = vals[j][1]; 
					}
				}
				
				newrow['_row_index'] = curRowNum;
				res.rowsArr.push(newrow);
				curRowNum++;
				if (curRowNum<arrowdata.numRows) {
					vals = [...arrowdata.get(curRowNum)];
					curRowLevel = groupsArr[vals[groupingIDIndex][1]].level;
				} 
			}
			
			res.curRowNum = curRowNum;
			res.curRowValues = vals;
			return res;
		}
		// **********
		let curRowNum = 0;
		while (curRowNum<arrowdata.numRows) {
			let vals = [...arrowdata.get(curRowNum)];
			let newrow = { _level: 0, };
			let groupingid = vals[groupingIDIndex][1];
			if (groupsArr[groupingid].level>0) {
				let processResult = processDataRow(curRowNum,1,vals);
				newrow['_children'] = processResult.rowsArr;
				curRowNum = processResult.curRowNum;
				vals = processResult.curRowValues;
			} 
			
			if (curRowNum<arrowdata.numRows) {
				newrow[this._dataTreeElementColumnName] = vals[groupsArr[vals[groupingIDIndex][1]].namefieldindex][1];
				for (let j=0;j<arrowdata.schema.fields.length;j++) {
					newrow[arrowdata.schema.fields[j].fldname] = vals[j][1]; 
				}
			}
			
			newrow['_row_index'] = curRowNum;
			resArray.push(newrow);
			curRowNum++;
		}
		
		
		
		// **********
		//~ for (let i=0;i<arrowdata.numRows;i++) {
			//~ let newrow = { "_row_index": i };
			//~ // [...arrowdata.get(i)]   --->  [Array(2), Array(2)] 
			//~ const vals = [...arrowdata.get(i)];
			//~ for (let j=0;j<arrowdata.schema.fields.length;j++) {
				//~ newrow[arrowdata.schema.fields[j].fldname] = vals[j][1]; 
			//~ }
			
			//~ resArray.push(newrow);
		//~ }
		// **********
		return resArray;
	}
	// -------------------------------------------------------------------------
	
	
	// ------------------------------------
	
	//~ async applyColumnLayout(newColumnLayout) {
			
	//~ }
	
	// ------------------------------------

	
}

