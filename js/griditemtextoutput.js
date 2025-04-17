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
		this.promptsymbols = '>>>';
		this.textoutput = this.getElementByTemplateID('textoutput');   
	}
	
	
	init() {
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
	}
	
	menuEventHandler(obj,eventdata) {
		//console.log("GridItemTextOutput widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'cleartextoutputitem') {
			this.textoutput.value = '';	
		}
		
	}
	
	addToOutput(textMessage, textMessageWithPromptSymbols=null) {
		if (textMessageWithPromptSymbols) {
			this.textoutput.value += this.promptsymbols + textMessageWithPromptSymbols + "\n";
		}
		this.textoutput.value += textMessage + "\n";
		this.textoutput.scrollTop = this.textoutput.scrollHeight;
	}
	
}

// ---------------------------------------------------------------------

export class StatusGridItemTextOutput extends GridItemTextOutput {

	constructor (params) {
		super(params);
	}
	
	init() {
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
	}
	
	menuEventHandler(obj,eventdata) {
		if (eventdata?.menuItemId === 'cleartextoutputitem') {
			this.textoutput.value = '';	
		}
	}	
	
	statusUpdate(eventdata) {
		
		if (eventdata?.state?.includes('_loading') || eventdata?.state?.includes('db_initializing')) {
			this.addToOutput(eventdata?.message);
		} else if (eventdata?.state?.includes('pyodide_load_success') || eventdata?.state?.includes('db_initialize_success') ) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
			this.addToOutput(eventdata?.fullversionstring);
		} else if (eventdata?.state?.includes('pyodide_core_packages_load_success')) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
		} else if (eventdata?.state?.includes('db_connected_success')) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
			this.addToOutput('Connected to db: '+ eventdata?.dbconnected);
		}
		
		
	}
	
	
}
