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
		cmdtemplate: `import pandas as pd
{{df}}=pd.DataFrame()`,
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
	// -------------------------------------------------------------------------------
	{
		actionid: "ImportParquetFileToDF",
		name: "Import Parquet File To Dataframe",
		description: "Import Parquet File To Dataframe",
		cmdtemplate: `import pandas as pd
import fastparquet
import numpy as np
np.float_ = np.float64
{{df}} = pd.read_parquet('{{filepath}}', engine='fastparquet')
`,
		cmdexample: `df = pd.read_parquet("/app/opfs/buffer1.parquet", engine="fastparquet")`,
		actiontype: ["import"],
		parameters: { df: "string", filepath: "string",   },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "ImportCSVFileToDF",
		name: "Import CSV File To Dataframe",
		description: "Import CSV File To Dataframe",
		cmdtemplate: `import pandas as pd
{{df}} = pd.read_csv('{{filepath}}')
`,
		cmdexample: `df = pd.read_csv('/app/mount_dir/onlineretail.csv')`,
		actiontype: ["import"],
		parameters: { df: "string", filepath: "string",   },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "RenameDFColumn",
		name: "Rename column",
		description: "Rename Dataframe column",
		cmdtemplate: `{{df}}.rename(columns={ {{columnmap}} }, errors="raise", inplace=True)`,
		cmdexample: `df.rename(columns={"A": "a", "B": "b", "C": "c"}, errors="raise", inplace=True)`,
		actiontype: ["column"],
		parameters: { df: "string", columnmap: "string",   },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "ConvertDFColToNumeric",
		name: "Convert to numeric",
		description: "Convert Dataframe column to numeric",
		cmdtemplate: `import pandas as pd
{{df}}[[df.iloc[:,{{colnum}}].name]] = {{df}}[[df.iloc[:,{{colnum}}].name]].apply(pd.to_numeric)`,
		cmdexample: `df[[df.iloc[:,4].name]] = df[[df.iloc[:,4].name]].apply(pd.to_numeric)`,
		actiontype: ["column"],
		parameters: { df: "string", colnum: "number",   },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "DetectDFColumnTypes",
		name: "Detect column types",
		description: "Detect column types",
		cmdtemplate: `{{df}}={{df}}.convert_dtypes()`,
		cmdexample: `df=df.convert_dtypes()`,
		actiontype: ["column"],
		parameters: { df: "string",    },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "ConvertDFColToDateTime",
		name: "Convert to datetime",
		description: "Convert to datetime",
		cmdtemplate: `import pandas as pd
{{df}}[df.iloc[:,{{colnum}}].name] = pd.to_datetime({{df}}[df.iloc[:,{{colnum}}].name])`,
		cmdexample: `df[df.iloc[:,4].name] = pd.to_datetime(df[df.iloc[:,4].name])`,
		actiontype: ["column"],
		parameters: { df: "string", colnum: "number",  },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	{
		actionid: "ExportDFToParquet",
		name: "Export Dataframe to parquet",
		description: "Export data frame to parquet",
		cmdtemplate: `import pandas as pd
import fastparquet
{{df}}.astype({col: 'string' for col in {{df}}.select_dtypes(include=['object']).columns}).to_parquet('/app/opfs/{{df}}.parquet', compression='zstd', engine='fastparquet', index=False)`,
		cmdexample: `import pandas as pd
import fastparquet
df.astype({col: 'string' for col in df.select_dtypes(include=['object']).columns}).to_parquet('/app/opfs/df.parquet', compression='zstd', engine='fastparquet', index=False)`,
		actiontype: ["cell", "column"],
		parameters: { df: "string",   },
		targetEnv: "py",
	},
	// -------------------------------------------------------------------------------
	// create or replace table tbl_df as (select * from '/app/opfs/df.parquet'); CHECKPOINT;

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
