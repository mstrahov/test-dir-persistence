/*******************
 * AppPageScriptControl - 
 * 
 * 
 * Requirements:  bootstrap5, gridstack.js
 * 
 * ****************************/

import { AppPageControl } from "./apppagecontrol.js";
import { GridItemPyEditor } from  "./griditempyeditor.js";
//import { GridItemSQLEditor } from  "./griditemsqleditor.js";
import { StatusGridItemTextOutput } from "./griditemtextoutput.js";
import { gridItemScript } from "./griditemscript.js";


export class AppPageScriptControl extends AppPageControl {
	constructor (params) {
		super(params);
		
		this.scriptControl = this.addGridItem( gridItemScript, {templateid:"#gridItemScriptDialog", headertext: "Script", griditemoptions: {w:6,h:5,} });
		this.pyeditor = this.addGridItem( GridItemPyEditor, {templateid:"#gridItemPythonCodeEditor", headertext: "Python", griditemoptions: {w:6,h:5,} });
		this.statusTabOutput = this.addGridItem( StatusGridItemTextOutput, {templateid:"#gridItemTextOutput", headertext: "Output", griditemoptions: {w:6,h:5,} });
		
	}
	
	async init() {
		
		
	}
	
}
