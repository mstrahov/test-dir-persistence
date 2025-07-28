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
		if (textMessage) {
			this.textoutput.value += textMessage + "\n";
		}
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
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditem', this, { });	
		} 
	}	
	
	statusUpdate(eventdata) {
		
		if (eventdata?.state?.includes('_loading') || eventdata?.state?.includes('db_initializing') || eventdata?.state?.includes('files_io_initializing') ) {
			this.addToOutput(eventdata?.message);
		} else if (eventdata?.state?.includes('pyodide_load_success') || eventdata?.state?.includes('db_initialize_success') ) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
			this.addToOutput(eventdata?.fullversionstring);
		} else if (eventdata?.state?.includes('pyodide_core_packages_load_success')) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
		} else if (eventdata?.state?.includes('db_connected_success')) {
			this.addToOutput(eventdata?.message + ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)');
			this.addToOutput('Connected to db: '+ eventdata?.dbconnected);
		} else if (eventdata?.state?.includes('files_io_init_success') || eventdata?.state?.includes('dir_mount_success') ) {   
			this.addToOutput(eventdata?.message);
			this.addToOutput('Mounted: '+ eventdata?.directoriesmounted);
		}
	}
	
	runExecutionUpdate(eventdata) {
		//  { targetEnv: targetEnv, cmd: cmdparams.cmd, result: res }
				//~ let res = {
			//~ targetEnv: 'py', 
			//~ output: null,
			//~ runStatus: undefined,
			//~ runResult: "",
			//~ error: null,
			//~ errormessage: null,
			//~ errorshort: null,
			//~ errortype: null,
			//~ errorline: null,
			//~ lengthmilli: 0,
			//~ lengthseconds: 0,
			//~ executionTime: 0,
			//~ uuid:  self.crypto.randomUUID(),  
		//~ }
		if (eventdata?.result?.runStatus) {
			//this.addToOutput('>>>' + eventdata?.cmd);
			
			if (eventdata?.result?.stdoutString) {
				this.addToOutput(eventdata?.result?.stdoutString + "\n" + eventdata?.result?.output, eventdata?.cmd);
			} else {
				if (eventdata?.targetEnv==="sql") {
					const nrows = eventdata?.result?.output?.numRows || 0;
					if (nrows>50) {
						this.addToOutput(eventdata?.result?.output?.slice(0,10).toString() 
								+ "\n<.....>\n" 
								+ eventdata?.result?.output?.slice(nrows-10,nrows).toString() + "\n" + nrows + " rows", eventdata?.cmd);
					} else {
						this.addToOutput(eventdata?.result?.output + "\n" + nrows + " rows", eventdata?.cmd);
					}
				} else {
					this.addToOutput(eventdata?.result?.output, eventdata?.cmd);
				}
			}
		} else {
			this.addToOutput(null,' ');
			if (eventdata?.msg) {
				this.addToOutput(eventdata?.msg?.toString());
			}
			if (eventdata?.result?.errorshort) {
				let msgtoadd = eventdata?.result?.errorshort;
				if (eventdata?.result?.errorline !== undefined) msgtoadd+=` (line:${eventdata?.result?.errorline?.toString()})`;
				this.addToOutput(msgtoadd);
			}
			console.log("Command execution error:",eventdata?.targetEnv, eventdata?.cmd, eventdata?.result?.error);
		}
		if (eventdata?.result?.executionTime !== undefined) {
			this.addToOutput(`Execution time: ${eventdata?.result?.executionTime} sec`);
		}
		
	}
	
	runExecutionFailure(eventdata) {
		//{ targetEnv: targetEnv, cmd: cmdparams.cmd, result: null, error: err }
		this.addToOutput(null,' ');
		console.error("Command execution failed:",eventdata?.targetEnv, eventdata?.cmd,eventdata?.error);
		if (eventdata?.msg) {
			this.addToOutput(eventdata?.msg?.toString());
		}
		this.addToOutput(eventdata?.error?.toString());
	}
	
	ioMessageUpdate(eventdata) {
		
		let length_add = '';
		if (eventdata?.lengthseconds) {
			length_add = ' ('+ Math.round(eventdata?.lengthseconds*1000)/1000 +' sec)';
		}
		if (eventdata?.msg) {
			this.addToOutput(eventdata?.msg?.toString()+length_add);
		}
		if (eventdata?.message) {
			this.addToOutput(eventdata?.message?.toString()+length_add);
		}
		if (eventdata?.error) {
			this.addToOutput(eventdata?.error?.toString());
		}
		if (eventdata?.params && eventdata?.params.error) {
			this.addToOutput(eventdata?.params.error.toString());
		}

	}
	
	
}
