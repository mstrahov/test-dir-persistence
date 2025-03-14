import { DataFrameTableView } from "./dataframetableview.js";
import { dfActionsList, getdfActionsArray } from "./dfaction.js";

export class TransformTableView extends DataFrameTableView {
	
	constructor(params) {
		super(params);
		
		this.tabulatorProperties = {
			...this.tabulatorProperties,
			selectableRange:1, 
			selectableRangeColumns:true,
			selectableRangeRows:true,	
			//--------------------
			spreadsheetColumnDefinition:{
					//editor:"input",
					contextMenu: this.generateCellContextMenu(),
					headerContextMenu:[
						{
							label:"Column header context menu",
							action:function(e, column){
								column.updateDefinition({title:"Updated Title"});
								let colIndex = column.getTable().getColumnLayout().findIndex((el)=>el.field===column.getField());
								console.log(column,"column=",colIndex);
							}
						},
					],
				},
				//-------------
				rowContextMenu:[
					{
						label:"Click here Row",
						action:function(e, row){
							console.log(e);
							console.log(row,"row=",row.getIndex());
						}
					},
				],
		};
		
	}
	
	generateCellContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["cell"]);
		console.log("actionsarr",actionsarr);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action: function(e, cell){
								let curColumn = cell.getColumn();
								let colIndex = curColumn.getTable().getColumnLayout().findIndex((el)=>el.field===curColumn.getField());
								console.log(cell,"row=",cell.getRow().getIndex(),"column=",colIndex);
								
								that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:cell.getRow().getIndex()-1, colnum:colIndex-1}}  );
							}
			});
			
		}
		
		return res;
	}
	
	generateColumnHeaderContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["column"]);
		return res;
	}
	
	generateRowContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["row"]);
		return res;
	}
	

}
