//  https://github.com/codemirror/codemirror5/blob/master/mode/sql/index.html
//  https://codemirror.net/5/mode/sql/index.html?mime=text/x-pgsql
/*******************
 * Grid item to be created in grid stack
 * SQL editor
 * depends: bootstrap, codemirror
 *
 * https://codemirror.net/5/doc/manual.html#commands
 * 
 * ****************************/
 
import { GridItemWithMenu } from "./griditemwithmenu.js";


export class GridItemSQLEditor extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		let that = this;
		this.codeEditorObj = CodeMirror.fromTextArea(this.bodyelement.querySelector('.code-editor'), {
				mode: "text/x-pgsql",
				lineNumbers: true,
				indentUnit: 4,
				
				indentWithTabs: true,
				smartIndent: true,
				
				matchBrackets: true,
				theme: "cobalt",
				autofocus: true,
				
				extraKeys: {
				  "Ctrl-Space": "autocomplete",
				  "Shift-Enter": function(cm) {
					//console.log("shift-enter pressed (codemirror)"); 
					that.runEditorCode("\n");
				  },
				  "Ctrl-Enter": function(cm) {
					//console.log("ctrl-enter pressed (codemirror)"); 
					that.runEditorCode("\n");
				  },
				  "Tab": function(cm) {
					var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
					cm.replaceSelection(spaces);
				  },
				  "Alt-A": "toggleComment"
				},
				 //~ hintOptions: {tables: {
				  //~ users: ["name", "score", "birthDate"],
				  //~ countries: ["name", "population", "size"]
				//~ }}
			});
	}

	menuEventHandler(obj,eventdata) {
		console.log("GridItemPyEditor widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'runcodeaction') {
			this.runEditorCode();
		//~ } else if (eventdata?.menuItemId === 'savelayout') {
			
		}
		
	}
	
	runEditorCode() {
		console.log("py code run from editor");
		
	}
	
}
