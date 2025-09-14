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
 
import { GridItemEditorWithHistory } from "./griditemwithmenu.js";


export class GridItemSQLEditor extends GridItemEditorWithHistory {

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
				theme: "colorforth",
				autofocus: true,
				
				extraKeys: {
				  "Ctrl-Space": "autocomplete",
				  "Shift-Enter": function(cm) {
					console.log("shift-enter pressed (codemirror)"); 
					that.runSelectedEditorCode("\n");
				  },
				  "Ctrl-Enter": function(cm) {
					console.log("ctrl-enter pressed (codemirror)"); 
					that.runEditorCode("\n");
				  },
				  "Tab": function(cm) {
					var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
					cm.replaceSelection(spaces);
				  },
				  "Alt-A": "toggleComment",
				  "Alt-Up": function(cm) {
					console.log("ALT-UP pressed (codemirror)"); 
					that.showPreviousCommand();
				  },
				  "Shift-Alt-Up": function(cm) {
					console.log("SHIFT-ALT-UP pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  "Alt-Down": function(cm) {
					console.log("ALT-DOWN pressed (codemirror)"); 
					that.showNextCommand();
				  },
				  "Shift-Alt-Down": function(cm) {
					console.log("SHIFT-ALT-DOWN pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  
				},
				 //~ hintOptions: {tables: {
				  //~ users: ["name", "score", "birthDate"],
				  //~ countries: ["name", "population", "size"]
				//~ }}
			});
			
		this.codeEditorObj.on("change", this.codeEditorObjOnChange.bind(this));
	}

	menuEventHandler(obj,eventdata) {
		//console.log("GridItemPyEditor widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'runcodeaction') {
			this.runEditorCode();
		} else if (eventdata?.menuItemId === "arrowupaction") {
			this.showPreviousCommand();
		} else if (eventdata?.menuItemId === "cleareditorgriditem") {
			this.clearEditor();
		} else if (eventdata?.menuItemId === "prevcommandmenuitem") {
			this.showPreviousCommand();
		} else if (eventdata?.menuItemId === "nextcommandmenuitem") {
			this.showNextCommand();
		} else if (eventdata?.menuItemId === "runselectedcommandmenuitem") {
			this.runSelectedEditorCode("\n");
		} else if (eventdata?.menuItemId === "runcommandmenuitem") {
			this.runEditorCode("\n");
		} else if (eventdata?.menuItemId === "dumpallhistory") {
			this.showAllHistory();
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });	
		} 
		
	}
	
	runEditorCode() {
		//console.log("py code run from editor");
		this.eventbus.dispatch('runeditorcode', this, {cmd: this.getValue(), successcallback: this.clearEditor.bind(this,false), });
		
		// maybe myCodeMirror.setOption("readOnly", false); until callback ? 
	}
	
	runSelectedEditorCode() {
		//  codeEditorObj.somethingSelected()   Return true if any text is selected.
		if ( this.codeEditorObj.somethingSelected() ) {
			this.eventbus.dispatch('runeditorcode', this, {cmd: this.getSelection(), successcallback: ()=>{},});
		} else {
			this.runEditorCode();
		}	
	}
	
	updateHintOptions() {
			// this.codeEditorObj.setOption('hintOptions',val)
			//~ select table_name, column_name from duckdb_columns where internal = false order by table_name, column_name;

	}
	
	
}
