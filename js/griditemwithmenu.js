/*******************
 * Grid item to be created in grid stack
 * with draggable icon, top dropdown menu, icon actions in top bar
 * 
 * 
 * ****************************/
import { GridItem } from "./griditem.js";
import { MenuEventsControl } from "./menueventscontrol.js";
import EventBus from "./eventbus.js";

export class GridItemWithMenu extends GridItem {
	
	constructor (params) {
		super(params);
		
		this.dropdownMenuElementSelector = '#' + this.headerelement.querySelector('.dropdown-menu')?.getAttribute('id');
		this.dropdownMenuControl = new MenuEventsControl({dropDownMenuElementId:this.dropdownMenuElementSelector, parentUUID: this.uuid, multiLevelMenu:false});
		
		// clickable-item-action - top svg action items events:
		
		this.eventbus = new EventBus(this);
		const clickableitems = this.headerelement.querySelectorAll('.clickable-item-action');
		clickableitems.forEach(menuitem => {
			//console.log("menuitem ",menuitem);
			menuitem.addEventListener("click", this.onClickClickableActionEvent.bind(this));
		},this);
		
		
	}
	
	init() {
		//~ this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.headerControlEventHandler.bind(this));
		//~ this.eventbus.subscribe('clickableactionclick',this.headerControlEventHandler.bind(this));
	}
	
	onClickClickableActionEvent(evt) {
		evt.preventDefault();
		let menuItemId =  evt.target.getAttribute('id') || evt.target.parentElement?.getAttribute('id')  || evt.target.parentElement?.parentElement?.getAttribute('id') || evt.target.parentElement?.parentElement?.parentElement?.getAttribute('id');
		//window.testevt = evt;
		let menuItemText = evt.target.textContent;
		if (menuItemId) {
			menuItemId = menuItemId.replace(this.uuid, "");
		}
		//console.log("Menu clicked: ", this.#parentUUID, menuItemId, menuItemText);
		this.eventbus.dispatch('clickableactionclick',this,{parentUUID:this.uuid, menuItemId:menuItemId, menuItemText:menuItemText});
	}
	
	
	headerControlEventHandler(obj,eventdata) {
		//console.log("GridItemWithMenu widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		//~ if (eventdata?.menuItemId === 'compactview') {
			//~ this.grid.compact();
		//~ } else if (eventdata?.menuItemId === 'savelayout') {
			//~ console.log(this.layoutToJSON());
		//~ }
		
	}
	
}

// -------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------


export class GridItemEditorWithHistory extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.cmdhistory = params.editorhistory?[...params.editorhistory]:[];
		this.cmdhistoryPosition = this.cmdhistory.length;
		this.contentsChanged = false;
		this.codeEditorObj = null;
		
		//~ this.buildInterfaceItems();
	}
	// ------------------------------------------------------------------------------
	//~ get widgetName() {
		//~ return this.__proto__?.constructor?.name
	//~ }
	// ------------------------------------------------------------------------------
	
	clearAfterRunSwitchValue() {
		let fieldsContainerElement = this.headerelement.querySelector('#clearafterrunswitch'+this.uuid);
		if (!fieldsContainerElement) {
			console.error('#clearafterrunitem element not found, cannot build a copy template control');
			return false;
		}
		//console.log('#clearafterrunswitch',fieldsContainerElement, fieldsContainerElement.checked);
		return fieldsContainerElement.checked;
	}
	
	// ------------------------------------------------------------------------------
	//~ buildInterfaceItems() {
		//~ //  clearafterrunitem
		//~ // clearafterrunswitch
		//~ // <div class="form-check form-switch form-check-inline mb-0 me-2">
		  //~ // <input class="form-check-input" type="checkbox" id="clearafterrunswitch">
		  //~ // <label class="form-check-label" for="clearafterrunswitch">Clear after run</label>
		//~ // </div>
		
		//~ let fieldsContainerElement = this.headerelement.querySelector('#clearafterrunitem'+this.uuid);
		//~ if (!fieldsContainerElement) {
			//~ console.error('#clearafterrunitem element not found, cannot build a copy template control');
			//~ return false;
		//~ }
		//~ let switchID = 'clearafterrunswitch_' + this.uuid;
		//~ let el = document.createElement("div");
		//~ let classNames = "form-check form-switch form-check-inline mb-0 me-2".split(" ");
		//~ classNames.forEach((className) => {
			//~ el.classList.add(className);
		//~ });
		//~ fieldsContainerElement.appendChild(el);
		//~ // ----
		//~ let el2 = document.createElement("input");
		//~ el2.classList.add("form-check-input");
		//~ el2.setAttribute("type", "checkbox");
		//~ el2.id = switchID;
		//~ el.appendChild(el2);
		//~ // ---
		//~ el2 = document.createElement("label");
		//~ el2.classList.add("form-check-label");
		//~ el2.setAttribute("for", switchID);
		//~ el2.innerText = "Clear after run";
		//~ el.appendChild(el2);
		
	//~ }

	
	// ------------------------------------------------------------------------------
	codeEditorObjOnChange(instance, changeObj) {
		//console.log("Changes",changeObj);
		if (changeObj.origin !=='setValue') {
			this.contentsChanged = true;
		}
		//console.log(this.contentsChanged,this.cmdhistoryPosition,this.cmdhistory);
	}
	
	// ------------------------------------------------------------------------------
	clearEditor(ignoreClearAfterRunSwitch=true) {
		//~ let editorcontents = this.getValue();
		//~ if (this.contentsChanged && editorcontents && editorcontents.trim().length>0) {
			//~ if (!editorcontents.endsWith("\n")) { editorcontents+="\n"}
			//~ this.cmdhistory.push(editorcontents);
			//~ this.cmdhistoryPosition = this.cmdhistory.length;
		//~ }
		this.saveEditorContentsToHistoryIfChanged();
		
		if (ignoreClearAfterRunSwitch || this.clearAfterRunSwitchValue()) {
			this.codeEditorObj.setValue('');
		}		
		
	}
	// ------------------------------------------------------------------------------
	saveEditorContentsToHistoryIfChanged() {
		let editorcontents = this.getValue();
		if (this.contentsChanged && editorcontents && editorcontents.trim().length>0) {
			if (!editorcontents.endsWith("\n")) { editorcontents+="\n"}
			this.cmdhistory.push(editorcontents);
			this.cmdhistoryPosition = this.cmdhistory.length;
		}
		this.contentsChanged = false;
	}
	// ------------------------------------------------------------------------------
	setCursorToLastLine() {
	/*
		 * doc.setCursor(pos: {line, ch}|number, ?ch: number, ?options: object)
	Set the cursor position. You can either pass a single {line, ch} object, or the line and the character as two separate parameters.
	* editor.lineCount();
	* */	
		this.codeEditorObj.setCursor(this.codeEditorObj.lastLine());
		this.codeEditorObj.scrollIntoView(this.codeEditorObj.lastLine(),0);
		this.codeEditorObj.focus();
	}
	// ------------------------------------------------------------------------------
	getSelection() {
		/*
		 * doc.somethingSelected() boolean
		Return true if any text is selected.
		* 
				 * doc.getSelection(?lineSep: string) string
		Get the currently selected code. Optionally pass a line separator to put between the lines in the output. When multiple selections are present, they are concatenated with instances of lineSep in between.
		*   */
		if ( this.codeEditorObj.somethingSelected() ) {
			return this.codeEditorObj.getSelection("\n");
		} 
		return '';
	}
	// ------------------------------------------------------------------------------
	getValue() {
		//~ doc.getValue(?separator: string) → string
		//~ Get the current editor content. You can pass it an optional argument to specify the string to be used to separate lines (defaults to "\n").
		return this.codeEditorObj.getValue()
	}
	// ------------------------------------------------------------------------------
	setValue(valstr) {
		//~ doc.setValue(content: string)    Set the editor content.
		this.clearEditor();
		this.codeEditorObj.setValue(valstr);
	}
	// ------------------------------------------------------------------------------
	showPreviousCommand() {
		if (this.cmdhistory.length===0) { return;}
		this.cmdhistoryPosition--;
		if (this.cmdhistoryPosition<0) {this.cmdhistoryPosition = this.cmdhistory.length-1; }
		
		if (this.contentsChanged) {
			let editorcontents = this.getValue();
			if (editorcontents && editorcontents.trim().length>0) {
				this.cmdhistory.push(editorcontents);
			}
		}
		this.setValue(this.cmdhistory[this.cmdhistoryPosition]);
		this.setCursorToLastLine();
		this.contentsChanged = false;
	}
	// ------------------------------------------------------------------------------
	showNextCommand() {
		if (this.cmdhistory.length===0) { return;}
		this.cmdhistoryPosition++;
		if (this.cmdhistoryPosition>=this.cmdhistory.length) {this.cmdhistoryPosition = 0; }
		
		if (this.contentsChanged) {
			let editorcontents = this.getValue();
			if (editorcontents && editorcontents.trim().length>0) {
				this.cmdhistory.push(editorcontents);
			}
		}
		this.setValue(this.cmdhistory[this.cmdhistoryPosition]);
		this.setCursorToLastLine();
		this.contentsChanged = false;
	} 
	
	// ------------------------------------------------------------------------------
	showAllHistory() {
		if (this.cmdhistory.length===0) { return;}
		if (this.contentsChanged) {
			let editorcontents = this.getValue();
			if (editorcontents && editorcontents.trim().length>0) {
				this.cmdhistory.push(editorcontents);
			}
		}
		this.cmdhistoryPosition=this.cmdhistory.length;
		const historystr =  this.cmdhistory.reduce(
					(accumulator, currentValue) => accumulator + currentValue,
				'');
		
		this.setValue(historystr);
		this.setCursorToLastLine();
		this.contentsChanged = false;
	} 
	
	// ------------------------------------------------------------------------------
	insertStringAtCursor(valstr) {
		this.codeEditorObj.replaceRange(valstr, this.codeEditorObj.getCursor());
		this.codeEditorObj.focus();
	}
	// ------------------------------------------------------------------------------
	

	toOwnFormat() {
		let res = super.toOwnFormat();
		res.cmdhistory = this.cmdhistory;
		
		return res;
	}
	
	
	
}

// -------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------
/*
 * testpycode.#codeEditorObj.cursorCoords(true,'local')
 * testpycode.#codeEditorObj.getCursor()
Pos {line: 2, ch: 5, sticky: 'after'}    (index 0-based)
 * 
 * INSERT AT CURSOR POSITION:
 * testpycode.#codeEditorObj.replaceRange("insert test string",testpycode.#codeEditorObj.getCursor())
 * 
 * */
