/********************************
 *  requires Tabulator.js
 * 	Extends griditemTableDFPaged with menus for row, columns, cells, taken from cmdActionsList to generate commands for dftransforms (or subscriber)
 * 
 * *******************************/

import { griditemTableDFPaged } from "./griditemtabledfpaged.js";
import { getcmdActionsArray } from "./cmdactiontemplates.js";

export class griditemTableDFPagedTransform extends griditemTableDFPaged {
	
	constructor(params) {
		super(params);
		
		this.tabulatorProperties = {
			...this.tabulatorProperties,
			selectableRange:1, 
			selectableRangeColumns:true,
			selectableRangeRows:true,	
			rowContextMenu:this.generateRowContextMenu.bind(this),
		};
		
		this.headerContextMenuGeneratorFunction = this.generateColumnHeaderContextMenu.bind(this);
		this.cellContextMenuGeneratorFunction = this.generateCellContextMenu.bind(this);
		
	}
	// --------------------------------------------
	generateCellContextMenu() {
		let res = [];
		const actionsarr = getcmdActionsArray(["cell"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action: function(e, cell){
								let curColumn = cell.getColumn();
								let colIndex = curColumn.getTable().getColumnLayout().findIndex((el)=>el.field===curColumn.getField());
								that.eventbus.dispatch('cmdActionEvent',that,{actionid:a.actionid, parameters:{df:that.dfname,rownum:cell.getRow().getIndex(), colnum:colIndex-1}}  );
							}
			});
		}
		return res;
	}
	
	// --------------------------------------------
	generateColumnHeaderContextMenu() {
		let res = [];
		const actionsarr = getcmdActionsArray(["column"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action: function(e, column){
								let colIndex = column.getTable().getColumnLayout().findIndex((el)=>el.field===column.getField());
								let columnmap = `"${that.columnstypes?.index[colIndex-1]}" : "${that.columnstypes?.index[colIndex-1]}"`;
								that.eventbus.dispatch('cmdActionEvent',that,{actionid:a.actionid, parameters:{df:that.dfname, colnum:colIndex-1, columnmap:columnmap}}  );
						}
			});
		}
		return res;
	}
	// --------------------------------------------
	generateRowContextMenu() {
		let res = [];
		const actionsarr = getcmdActionsArray(["row"]);
		const that = this;
		for (const a of actionsarr) {
			res.push({
				label:a.name,
				action:	function(e, row){
							that.eventbus.dispatch('cmdActionEvent',that,{actionid:a.actionid, parameters:{df:that.dfname,rownum:row.getIndex() }}  );
						}
			});	
		}
		return res;
	}
	

}
