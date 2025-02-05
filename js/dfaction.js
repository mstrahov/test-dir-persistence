/*---------------------
 * dataframe  action list and single action code generator from template     
 * 
 * eg:	let a1 = new dfAction({actionid:"DeleteColumnByIndex",parameters:{df:"df",colnum:"2"}}); console.log(a1,a1.pycode());
 * actiontype :  where action should appear in gui table interface (column/cell/row context)
 * 
 * Get a list of actions:  
 * 		getdfActionsArray("row");
 * 		getdfActionsArray(["row","column"]);
 * -----------------------*/

const dfActionsList = [
	{
		actionid: "DeleteColumnByIndex",
		description: "Delete column",
		pytemplate: '{{df}} = {{df}}.drop({{df}}.columns[{{colnum}}], axis=1)',
		pyexample: 'df = df.drop(df.columns[2], axis=1)',
		actiontype: ["column","cell"],
		parameters: { df: "string", colnum: "number"},
	},
	{
		actionid: "DeleteRowByIndex",
		description: "Delete row",
		pytemplate: '{{df}}.drop({{df}}.index[{{rownum}}], inplace=True)',
		pyexample: 'df.drop(df.index[2], inplace=True)',
		actiontype: ["row","cell"],
		parameters: { df: "string", rownum: "number"},
	},
	{
		actionid: "PythonScript",
		description: "Python script",
		pytemplate: '{{df}}={{df}}',
		pyexample: 'df=df',
		actiontype: ["column","row","cell"],
		parameters: { df: "string"}
	},
	
];


export const getdfActionsArray = (actiontypes) => {
	let res = [];
	if(!actiontypes) {
		res = [...dfActionsList];
	} else {
		if (!Array.isArray(actiontypes)) {
			actiontypes = [actiontypes];
		}
		
		res = dfActionsList.filter((el)=>{
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

export class dfAction {
	#actionid;
	#actionobj;
	#actionparams;
	#pyCodeString;
	#pyTemplate;
	
	constructor (params) {
		this.#actionid = params.actionid;
		this.#actionparams = {...params.parameters};
		this.#actionobj = dfActionsList.find((e)=>e.actionid===this.#actionid);
		if(!this.#actionobj) {
			throw new Error('Action not found: '+this.#actionid);
		}
		this.#pyTemplate = this.#actionobj?.pytemplate;
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
	
	set pyTemplate(v) {
		this.#pyTemplate = v;
	}
	
	get pyTemplate() {
		return this.#pyTemplate;
	}
		
	pycode() {
		const regex = /{{(.*?)}}/g;
		const result = this.#pyTemplate.replace(regex, (match, captureKey) => { 
			return this.#actionparams[captureKey] || '';
		});
		this.#pyCodeString = result;
		return result;
	}
		
}


// ====================================================================================

function testdfActionTemplates() {
		window.testdfaction = new dfAction({actionid:"DeleteRowByIndex",parameters:{df:"df",rownum:"1"}});
		console.log(window.testdfaction, window.testdfaction.pycode());
		let a1 = new dfAction({actionid:"DeleteColumnByIndex",parameters:{df:"df",colnum:"2"}});
		console.log(a1,a1.pycode());
		a1 = new dfAction({actionid:"PythonScript",parameters:{df:"df",colnum:"2"}});
		console.log(a1,a1.pycode());	
}
