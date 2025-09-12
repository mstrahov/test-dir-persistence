/**********
 * gridItemDBView
 * depends: Tabulator.js
 * 
 * own format browser
 * 
 ***********************************   */
import { GridItemWithMenu } from "./griditemwithmenu.js";
import { getTreeDataRows } from "./utilities.js";

export class gridItemDBView extends GridItemWithMenu {
	#internalContainer;
	
	constructor (params) {
		super(params);
		
			
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		this.coderunner = params.coderunner;
		this.parentuuid = params.parentuuid;
		
		this.awaitingrefresh = false;
		
		this.tabulatorProperties = params.tabulatorProperties || {};

		//~ this._dataTreeElementColumnName = "_tree_Column";
		
		//~ this.headerContextMenuGeneratorFunction = undefined; 
		//~ this.cellContextMenuGeneratorFunction = undefined; 
		this.#internalContainer = this.bodyelement;
		
		this.tabulatorObj = undefined;
		
		this.defaultCellContextMenu = [
			{
				label:"Copy",
				action:function(e, cell){
					(async (text)=> {await navigator.clipboard.writeText(text);})(cell.getValue());
				}
			},
		];
		
		this.lastcolumnlayout = undefined;
		if (params.columnlayout) {
			try {
				this.lastcolumnlayout = JSON.parse(JSON.stringify(params.columnlayout));
			} catch (err) {
				console.warn("Error processing initial column layout",err);
			}
		}
		
		this.buildTemplatesFilter();
		//~ this.coderunner.eventbus.subscribe('InteractiveVariableChange',this.refreshOnVariableChange.bind(this), this.uuid);
		
	}
	
	// -------------------------------------------------------------------------
	menuEventHandler(obj,eventdata) {
		//console.log("gridItemFileDialog widget",this.__proto__?.constructor?.name, this.headerText, "item click: ",obj,eventdata); 
		
		if (eventdata?.menuItemId === "mountlocaldirectoryitem") {
			this.fileIOHandler.mountDirectory();
			
		} else if (eventdata?.menuItemId === "refreshgriditem" || eventdata?.menuItemId ===  "refreshaction") {
			// this.awaitingrefresh = true;
			this.refreshData();
			//~ this.fileIOHandler.syncFS();
		//~ } else if (eventdata?.menuItemId === "uploadfiletoopfsitem") {
			//~ this.awaitingrefresh = true;
			//~ this.fileuploaddialog.uploadFilesButtonClick();
			
		//~ } else if (eventdata?.menuItemId === "runcommandmenuitem") {
			//~ this.runEditorCode("\n");
		//~ } else if (eventdata?.menuItemId === "dumpallhistory") {
			//~ this.showAllHistory();
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });	
		}
		
	}
	// --------------------------------------------------------------------------
	
	async init() {
		let dbdatatree = await this.getDBTree();
		let that = this;
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:false,
			reactiveData:true, 
			columns:[
				{title:"Name", field:"leftcolumn", editor:false, headerSort:true, headerFilter:"input", headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),width:250, sorter:"string", headerSortTristate:true,},
				{title:"Alias", field:"namealias", editor:true, headerSort:true, headerFilter:"input", headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),width:150, sorter:"string",  headerSortTristate:true,},
				
				{title:"Data type", field:"data_type", editor:false, headerSort:true,width:120, sorter:"string", headerSortTristate:true, },
				{title:"Column default", field:"column_default", editor:false, headerSort:true,width:120, sorter:"string", headerSortTristate:true, },
				
				{title:"Column Index", field:"column_index", editor:false, headerSort:true,width:90, sorter:"number", headerSortTristate:true, },
			],
			data:dbdatatree,
			dataTree:true,
			dataTreeFilter:true,
			//dataTreeStartExpanded:false,
			dataTreeStartExpanded:[true, false, false, false],
			dataTreeChildIndent:27,
			dataTreeElementColumn:"leftcolumn", 
			selectableRows:1,
			selectableRowsPersistence:false,
			rowContextMenu:[
				{
					label:"Copy to clipboard",
					action:function(e, row){
						//console.log(row.getData());
						(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().leftcolumn);
					}
				},
			],
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
				
		this.tabulatorObj = new Tabulator(this.bodyelement, this.tabulatorProperties);
				
		this.tabulatorObj.on("rowDblClick", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().leftcolumn);
		});
		this.tabulatorObj.on("rowDblTap", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().leftcolumn);
		});
		
		
	}
	
	// -------------------------------------------------------------------------
	async refreshData(eventdata) {
		if  (this.tabulatorObj) {
			let dbdatatree = await this.getDBTree();
			this.tabulatorObj.setData(dbdatatree);
		}
		
	}	
	// -------------------------------------------------------------------------
	dbDescriptionSQLCmd() {
		
		const res = `SELECT CONCAT(dbschema,' - ',tabletype) as dbschematabletype, dbschema,database_name,schema_name,
tabletype,tabletypesorter,table_name,tableobjecttype,column_name,column_index,data_type,column_default,is_nullable,
data_type_id,character_maximum_length,'' as namealias
FROM (
SELECT CONCAT(cols.database_name,' (',cols.schema_name,')') AS dbschema
,cols.database_name AS database_name
,cols.schema_name AS schema_name
,CASE WHEN tbls.table_name IS NOT NULL THEN 'Tables' ELSE CASE WHEN vws.view_name IS NOT NULL THEN 'Views' ELSE 'OTHER' END END AS tabletype
,CASE WHEN tbls.table_name IS NOT NULL THEN 10 ELSE CASE WHEN vws.view_name IS NOT NULL THEN 20 ELSE 25 END END AS tabletypesorter
,cols.table_name AS table_name
,'Columns' AS tableobjecttype
,cols.column_name AS column_name
,cols.column_index::BIGINT AS column_index
,cols.data_type AS data_type
,cols.column_default AS column_default
,cols.is_nullable::VARCHAR AS is_nullable
,cols.data_type_id AS data_type_id
,cols.character_maximum_length AS character_maximum_length
FROM duckdb_columns() as cols left join duckdb_tables() as tbls on cols.database_oid = tbls.database_oid and cols.schema_oid = tbls.schema_oid and cols.table_oid = tbls.table_oid left join duckdb_views() as vws on cols.database_oid = vws.database_oid and cols.schema_oid = vws.schema_oid and cols.table_oid = vws.view_oid where cols.internal=false
UNION ALL 
SELECT CONCAT(database_name,' (',schema_name,')') AS dbschema
,database_name AS database_name
,schema_name AS schema_name
,'Tables' AS tabletype
,10 AS tabletypesorter
,table_name AS table_name
,'Constraints' AS tableobjecttype
,constraint_name AS column_name
,constraint_index::BIGINT AS column_index
,constraint_type AS data_type
,list_reduce(constraint_column_names,(acc,x)->concat(acc,',',x)) AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_constraints()
UNION ALL 
SELECT CONCAT(database_name,' (',schema_name,')') AS dbschema
,database_name AS database_name
,schema_name AS schema_name
,'Tables' AS tabletype
,10 AS tabletypesorter
,table_name AS table_name
,'Indexes' AS tableobjecttype
,index_name AS column_name
,index_oid AS column_index
,null AS data_type
,null AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_indexes()
UNION ALL 
SELECT CONCAT(database_name,' (',schema_name,')') AS dbschema
,database_name AS database_name
,schema_name AS schema_name
,'Sequences' AS tabletype
,30 AS tabletypesorter
,sequence_name AS table_name
,'' AS tableobjecttype
,null AS column_name
,sequence_oid AS column_index
,null AS data_type
,null AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_sequences()
UNION ALL 
SELECT null AS dbschema
,null AS database_name
,null AS schema_name
,'Variables' AS tabletype
,60 AS tabletypesorter
,name AS table_name
,'Value' AS tableobjecttype
,value AS column_name
,null AS column_index
,type::VARCHAR AS data_type
,null AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_variables()
UNION ALL 
SELECT CONCAT(database_name,' (',schema_name,')') AS dbschema
,database_name AS database_name
,schema_name AS schema_name
,'Functions' AS tabletype
,40 AS tabletypesorter
,function_name AS table_name
,'' AS tableobjecttype
,null AS column_name
,function_oid AS column_index
,function_type AS data_type
,null AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_functions() WHERE internal=false
UNION ALL 
SELECT null AS dbschema
,null AS database_name
,null AS schema_name
,'Prepared statements' AS tabletype
,50 AS tabletypesorter
,name AS table_name
,'' AS tableobjecttype
,statement AS column_name
,null AS column_index
,list_reduce(parameter_types,(acc,x)->concat(acc,',',x)) AS data_type
,null AS column_default
,null AS is_nullable
,null AS data_type_id
,null AS character_maximum_length
FROM duckdb_prepared_statements()
) AS t1 ORDER BY dbschema, dbschematabletype,tabletypesorter,table_name,tableobjecttype,column_index;
`;
		
		return res;
		
	}
	
	// -------------------------------------------------------------------------
	
	async getDBTree() {
		let res = [];
		
		const sqlres = await this.coderunner.runSQLAsync(this.dbDescriptionSQLCmd());
		if (sqlres?.runStatus) {
			// convert arrow to array
			let resArray = [];
			for (let i=0;i<sqlres.output.numRows;i++) {
				let newrow = { "_row_index": i };
				// [...sqlres.output.get(i)]   --->  [Array(2), Array(2)] 
				const vals = [...sqlres.output.get(i)];
				for (let j=0;j<sqlres.output.schema.fields.length;j++) {
					newrow[sqlres.output.schema.fields[j].name] = vals[j][1]; 
				}
				resArray.push(newrow);
			}
			// *****
			// getTreeDataRows(rowsarr, sortfields, rollupfields, recalccallback, filterarr=[], childrenrowscallback, alreadysorted=false) 
			res = getTreeDataRows(resArray,["dbschematabletype","table_name","tableobjecttype","column_name"],[],undefined,[],undefined,true);
			
		} else {
			console.error("DB Tree query error:", sqlres.error);
			this.eventbus.dispatch('CmdExecutionError', this, { targetEnv: 'sql', result: sqlres });
			
		}
		
		return res;
	}	
	
	// --------------------------------------------------------------------------
	
	
	// --------------------------------------------------------------------------				
	customHeaderIncludesStringFunction(headerValue, rowValue, rowData, filterParams) {
		//headerValue - the value of the header filter element
		//rowValue - the value of the column in this row
		//rowData - the data for the row being filtered
		//filterParams - params object passed to the headerFilterFuncParams property
		// column.setHeaderFilterValue("");
		let res = true;
		//console.log("header filter",headerValue,rowData);
		if (!headerValue||headerValue.length==0) { return true; } 
		try {
			if (rowData._children) { return true; }
			if(rowValue){
				res = rowValue.toLowerCase().includes(headerValue.toLowerCase());
				//console.log("header filter res",res,rowValue,rowData);
			} 
		} catch (e) {
			console.error(e);
		}						
		
		return res;
	}	
	// --------------------------------------------------------------------------	
	
	buildTemplatesFilter() {
		
		const templatesArr = [',field as alias','field as alias,',',field','field,'];
		
		let fieldsContainerElement = this.headerelement.querySelector('#copytemplatesgroup'+this.uuid);
		if (!fieldsContainerElement) {
			console.error('#copytemplatesgroup element not found, cannot build a copy template control');
			return false;
		}
		
		while(fieldsContainerElement.firstChild) fieldsContainerElement.removeChild(fieldsContainerElement.firstChild);
		
		for (let i=0;i<templatesArr.length;i++) {
			//~ <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
			//~ <label class="btn btn-outline-primary" for="btnradio1">,field as alias</label>
			let buttonID = 'btnradio_' + i + "_" + this.uuid;
			let buttonText = templatesArr[i];
			
			let el = document.createElement("input");
			el.setAttribute("type", "radio");
			let classNames = "btn-check".split(" ");
			classNames.forEach((className) => {
				el.classList.add(className);
			});
			el.id = buttonID;
			
			el.setAttribute("name", "btnradio");
			el.setAttribute("autocomplete", "off");
			if (i===0) {
				el.setAttribute("checked", "checked");
			}
			fieldsContainerElement.appendChild(el);
			
			el = document.createElement("label");
			classNames = "btn btn-outline-primary".split(" ");
			classNames.forEach((className) => {
				el.classList.add(className);
			});
			el.innerText = buttonText;
			el.setAttribute("for", buttonID);
			fieldsContainerElement.appendChild(el);
		}
		
		
	}
	
	
	// -------------------------------------------------------------------------
	async destroytabulatorobj() {		
		let that = this;
		return new Promise((resolve, reject) => {
			if (this.tabulatorObj) {
				try {
					that.tabulatorObj.on("tableDestroyed", ()=>{
						that.tabulatorObj = null;
						resolve();
					});
					that.tabulatorObj.clearData();
					that.tabulatorObj.setData([]).then(()=>{ that.tabulatorObj.destroy();});
				} catch (err) { 
					console.error(err);
					reject(err); 
				}
			} else {
				resolve();
			}
		})
	}
		
	// ---------------------------------------------------------------------------
	async destroy() {
		await this.destroytabulatorobj();
		await super.destroy();
	}
	
	// -------------------------------------------------------------------------

	toOwnFormat() {
		let res = super.toOwnFormat();
		res.parentuuid = this.parentuuid;
		// ------------
		if (this.tabulatorObj) {
			try {
				res.columnlayout = this.tabulatorObj.getColumnLayout();
			} catch (e) { console.warn("Column layout save error",e); }
		}	
		return res;
	}
	
	
	
		// -------------------------------------------------------------------------
}
