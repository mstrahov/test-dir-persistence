/*******************
 * Grid item to be created in grid stack
 * Python editorr
 * depends: bootstrap, codemirror
 *
 * 
 * 
 * ****************************/
 
import { GridItemWithMenu } from "./griditemwithmenu.js";


export class GridItemPyEditor extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
		let that = this;
		this.codeEditorObj = CodeMirror.fromTextArea(this.bodyelement.querySelector('.code-editor'), {
				mode: {name: "python",
					   version: 3,
					   singleLineStringErrors: false},
				lineNumbers: true,
				indentUnit: 4,
				matchBrackets: true,
				theme: "cobalt",
				autofocus: true,
				extraKeys: {
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
				}
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
