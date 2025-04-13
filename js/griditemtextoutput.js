/*******************
 * Grid item to be created in grid stack
 * Textbox output widget
 * depends: bootstrap
 *
 * 
 * ****************************/
import EventBus from "./eventbus.js";
import { GridItemWithMenu } from "./griditemwithmenu.js";

export class GridItemTextOutput extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		this.promptsymbols = '>>>';
		this.textoutput = this.getElementByTemplateID('textoutput');   
	}


	menuEventHandler(obj,eventdata) {
		//console.log("GridItemTextOutput widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'cleartextoutputitem') {
			this.textoutput.value = '';	
		}
		
	}
	
	addToOutput(textMessage,textMessageWithPromptSymbols=null) {
		if (textMessageWithPromptSymbols) {
			this.textoutput.value += this.promptsymbols + textMessageWithPromptSymbols + "\n";
		}
		this.textoutput.value += textMessage + "\n";
		this.textoutput.scrollTop = this.textoutput.scrollHeight;
	}
	
	
}

