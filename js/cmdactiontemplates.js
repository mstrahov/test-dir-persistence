/*---------------------
 * command  action list and single action code generator from template     
 * 
 * eg:	let a1 = new cmdAction({actionid:"DeleteColumnByIndex",parameters:{df:"df",colnum:"2"}}); console.log(a1,a1.cmdcode());
 * actiontype :  where action should appear in gui table interface (column/cell/row context)
 * 
 * Get a list of actions:  
 * 		getcmdActionsArray("row");
 * 		getcmdActionsArray(["row","column"]);
 * -----------------------*/

export const cmdActionsList = [
	{
		actionid: "DeleteColumnByIndex",
		name: "Delete column",
		description: "Delete column",
		cmdtemplate: '{{df}} = {{df}}.drop({{df}}.columns[{{colnum}}], axis=1)',
		cmdexample: 'df = df.drop(df.columns[2], axis=1)',
		actiontype: ["column","cell"],
		parameters: { df: "string", colnum: "number"},
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "DeleteRowByIndex",
		name: "Delete row",
		description: "Delete row",
		cmdtemplate: '{{df}}={{df}}.drop({{rownum}})',
		cmdexample: 'df=df.drop(2)',
		actiontype: ["row","cell"],
		parameters: { df: "string", rownum: "number"},
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "PythonScript",
		name: "Add python script",
		description: "Add python script",
		cmdtemplate: '{{df}}={{df}}',
		cmdexample: 'df=df',
		actiontype: ["column","row","cell"],
		parameters: { df: "string" },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "SQLScript",
		name: "Add SQL script",
		description: "Add SQL script",
		cmdtemplate: 'SELECT 1;',
		cmdexample: 'SELECT 1;',
		actiontype: ["sql"],
		parameters: { },
		targetEnv: "sql",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "FillDownColumnValues",
		name: "Fill down column values",
		description: "Fill down column values",
		cmdtemplate: "{{df}}.iloc[:, {{colnum}}] = {{df}}.iloc[:, {{colnum}}].ffill()",
		cmdexample: `df.iloc[:, 2] = df.iloc[:, 2].ffill()`,
		actiontype: ["column","cell"],
		parameters: { df: "string", colnum: "number"},
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "PromoteRowValuesToColumnNames",
		name: "Promote row values to column names",
		description: "Promote row values to column names",
		cmdtemplate: `col_counts = {}
new_cols = []
for index, col in enumerate({{df}}.loc[{{rownum}}]):
    if {{df}}.loc[{{rownum}}].isna()[index] or len(str(col)) == 0:
        print(col)
        new_col = {{df}}.columns[index]
    else:
        if col in col_counts:
            col_counts[col] += 1
            new_col = f"{col}_{col_counts[col]}"
        else:
            col_counts[col] = 1
            new_col = col
    new_cols.append(new_col)
{{df}}.columns = new_cols
`, 
		cmdexample: `col_counts = {}
new_cols = []
for index, col in enumerate(df.loc[0]):
    if df.loc[0].isna()[index] or len(str(col)) == 0:
        print(col)
        new_col = df.columns[index]
    else:
        if col in col_counts:
            col_counts[col] += 1
            new_col = f"{col}_{col_counts[col]}"
        else:
            col_counts[col] = 1
            new_col = col
    new_cols.append(new_col)
df.columns = new_cols`,
		actiontype: ["row"],
		parameters: { df: "string", rownum: "number"},
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "ImportExcelFileToDF",
		name: "Import Excel File To Dataframe",
		description: "Import Excel File To Dataframe",
		cmdtemplate: `import pandas as pd
import openpyxl
file = pd.ExcelFile('{{filepath}}')
{{df}} = pd.read_excel(file,sheet_name='{{sheetname}}', skiprows=0)`,
		cmdexample: `df = pd.read_excel(file,sheet_name='Sheet2', skiprows=0)`,
		actiontype: ["import"],
		parameters: { df: "string", filepath: "string", sheetname: "string",  },
		targetEnv: "py",
	},
	
];


export const getcmdActionsArray = (actiontypes) => {
	let res = [];
	if(!actiontypes) {
		res = [...cmdActionsList];
	} else {
		if (!Array.isArray(actiontypes)) {
			actiontypes = [actiontypes];
		}
		
		res = cmdActionsList.filter((el)=>{
				for (const action of actiontypes) {
					if (el.actiontype.includes(action)) {
						return true;
					}
				}
				return false;
			});
	}
	
	return res;
}

export class cmdAction {
	#actionid;
	#actionobj;
	#actionparams;
	#cmdCodeString;
	#cmdtemplate;
	
	constructor (params) {
		this.#actionid = params.actionid;
		this.#actionparams = {...params.parameters};
		this.#actionobj = cmdActionsList.find((e)=>e.actionid===this.#actionid);
		if(!this.#actionobj) {
			throw new Error('Action not found: '+this.#actionid);
		}
		this.#cmdtemplate = this.#actionobj?.cmdtemplate;
		// todo:  check parameters consistency?
	}
	
	get parameters() {
		return this.#actionparams;
	}
	
	set parameters(v) {
		this.#actionparams = {...v};	
	}
	
	get actionTemplateObj() {
		return this.#actionobj;
	}
	
	get actionid() {
		return this.#actionid;
	}
	
	set cmdtemplate(v) {
		this.#cmdtemplate = v;
	}
	
	get cmdtemplate() {
		return this.#cmdtemplate;
	}
		
	cmdcode() {
		const regex = /{{(.*?)}}/g;
		const result = this.#cmdtemplate.replace(regex, (match, captureKey) => { 
			if (this.#actionparams.hasOwnProperty(captureKey)) {
				return this.#actionparams[captureKey];
			}
			else { return ''; }
		});
		this.#cmdCodeString = result;
		return result;
	}
		
}


// ====================================================================================

function testcmdActionTemplates() {
		window.testcmdAction = new cmdAction({actionid:"DeleteRowByIndex",parameters:{df:"df",rownum:"1"}});
		console.log(window.testcmdAction, window.testcmdAction.cmdcode());
		let a1 = new cmdAction({actionid:"DeleteColumnByIndex",parameters:{df:"df",colnum:"2"}});
		console.log(a1,a1.cmdcode());
		a1 = new cmdAction({actionid:"PythonScript",parameters:{df:"df",colnum:"2"}});
		console.log(a1,a1.cmdcode());	
}
