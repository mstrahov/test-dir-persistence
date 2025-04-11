/*******************
 * Grid item to be created in grid stack
 * Python editor
 * depends: bootstrap, codemirror
 *
 * https://codemirror.net/5/doc/manual.html#commands
 * https://codemirror.net/5/doc/manual.html#api
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
				  "Alt-A": "toggleComment",
				  "Alt-Up": function(cm) {
					console.log("ALT-UP pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  "Shift-Alt-Up": function(cm) {
					console.log("SHIFT-ALT-UP pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  "Alt-Down": function(cm) {
					console.log("ALT-DOWN pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  "Shift-Alt-Down": function(cm) {
					console.log("SHIFT-ALT-DOWN pressed (codemirror)"); 
					//that.runEditorCode("\n");
				  },
				  
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
	
	runSelectedEditorCode() {
			//  codeEditorObj.somethingSelected()   Return true if any text is selected.
		
	}
	
	setCursor() {
	/*
	 * doc.setCursor(pos: {line, ch}|number, ?ch: number, ?options: object)
Set the cursor position. You can either pass a single {line, ch} object, or the line and the character as two separate parameters.
* */	
		
	}
	
	getSelection() {
		/*
		 * doc.getSelection(?lineSep: string) → string
Get the currently selected code. Optionally pass a line separator to put between the lines in the output. When multiple selections are present, they are concatenated with instances of lineSep in between.
*   */
		
	}
	
	getValue() {
		//~ doc.getValue(?separator: string) → string
		//~ Get the current editor content. You can pass it an optional argument to specify the string to be used to separate lines (defaults to "\n").
	}
	
	setValue() {
		//~ doc.setValue(content: string)
//~ Set the editor content.
	}
	
	
}


// ------------shortcuts ------------------
/*
 *
 *doc.firstLine() → integer
Get the number of first line in the editor. This will usually be zero but for linked sub-views, or documents instantiated with a non-zero first line, it might return other values.
doc.lastLine() → integer
Get the number of last line in the editor. 
 * 
 * 
 * cm.scrollIntoView(what: {line, ch}|{left, top, right, bottom}|{from, to}|null, ?margin: number)
Scrolls the given position into view. what may be null to scroll the cursor into view, a {line, ch} position to scroll a character into view, a {left, top, right, bottom} pixel range (in editor-local coordinates), or a range {from, to} containing either two character positions or two pixel squares. The margin parameter is optional. When given, it indicates the amount of vertical pixels around the given area that should be made visible as well.
* 
* 
 *  
 *   https://codemirror.net/5/doc/manual.html#commands
Action	CodeMirror Shortcuts Windows	CodeMirror Shortcuts Mac
Select all	Ctrl + A	Command + A
When multiple selections are present, deselect all but the primary selection	Esc	Esc
Delete the line under the cursor	Ctrl + D	Command + D
Undo last change	Ctrl + Z	Command + Z
Redo the last undone change	Ctrl + Y	Command + Y
Undo the last change	Ctrl + U	Command + U
Redo the last change	Alt + U	Option + U
Move the cursor to the start of the document	Ctrl + Home	Command + Home
Move the cursor to the end of the document	Ctrl + End	Command + End
Move the cursor to the start of the line	Alt + Left Arrow key	Option + Left Arrow key
Move to the start of the text on the line, or if we are already there, go to the actual start of the line (including whitespace)	Home	Home
Move the cursor to the end of the line	Alt + Right Arrow key	Option + Right Arrow key
Move the cursor up one line	Up Arrow key	Up Arrow key
Move the cursor down one line	Down Arrow key	Down Arrow key
Move the cursor up one screen, and scroll up by the same distance	Page Up key	Page Up key
Move the cursor down one screen, and scroll down by the same distance	Page Down key	Page Down key
Move the cursor one character left, going to the previous line when hitting the start of the line	Right Arrow key	Right Arrow key
Move the cursor one character right, going to the next line when hitting the end of the line	Left Arrow key	Left Arrow key
Move to the left of the group before the cursor.	Ctrl + Left Arrow key	Command + Left Arrow key
Move to the right of the group after the cursor	Ctrl + Right Arrow key	Command + Right Arrow key
Delete the character before the cursor	Shift +  Backspace	Shift +  Backspace
Delete the character after the cursor	Delete	Delete
Delete to the left of the group before the cursor	Ctrl +  Backspace	Command +  Backspace
Delete to the start of the group after the cursor	Ctrl + Delete	Command + Delete
Auto-indent the current line or selection	Shift + Tab	Shift + Tab
Indent the current line or selection by one indent unit	Ctrl + ]	Command + ]
Dedent the current line or selection by one indent unit	Ctrl + [	Command + [
If something is selected, indent it by one indent unit. If nothing is selected, insert a tab character	Tab	Tab
Insert a new line and auto-indent the new line	Enter	Enter
Toggle the overwrite flag	Insert	Insert
Not defined by the core library, only referred to in keymaps	Ctrl + S	Command + S
Find	Ctrl + F	Command + F
Find next	Ctrl + G	Command + G
Find Previous	Shift + Ctrl + G	Shift + Command + G
Replace	Shift + Ctrl + F	Shift + Command + F
* 
*/
