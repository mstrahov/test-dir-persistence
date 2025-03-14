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
				headerContextMenu:this.generateColumnHeaderContextMenu(),
			},
			//-------------
			rowContextMenu:this.generateRowContextMenu(),
		};
		
	}
	// --------------------------------------------
	generateCellContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["cell"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action: function(e, cell){
								let curColumn = cell.getColumn();
								let colIndex = curColumn.getTable().getColumnLayout().findIndex((el)=>el.field===curColumn.getField());
								that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:cell.getRow().getIndex()-1, colnum:colIndex-1}}  );
							}
			});
		}
		return res;
	}
	
	// --------------------------------------------
	generateColumnHeaderContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["column"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action: function(e, column){
								let colIndex = column.getTable().getColumnLayout().findIndex((el)=>el.field===column.getField());
								that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df", colnum:colIndex-1}}  );
						}
			});
		}
		return res;
	}
	// --------------------------------------------
	generateRowContextMenu() {
		let res = [];
		const actionsarr = getdfActionsArray(["row"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action:	function(e, row){
							that.eventbus.dispatch('dfActionEvent',that,{actionid:a.actionid, parameters:{df:"df",rownum:row.getIndex()-1 }}  );
						}
			});	
		}
		return res;
	}
	

}
