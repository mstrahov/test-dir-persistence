/*******************
 * Grid item to be created in grid stack
 * Html output widget
 * depends: bootstrap
 *
 * 
 * ****************************/
import { GridItemWithMenu } from "./griditemwithmenu.js";

export class GridItemHTMLOutput extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.appuuid = params.appuuid;
		
	}
	
	
	init() {
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
	}
	
	menuEventHandler(obj,eventdata) {
		//console.log("GridItemHTMLOutput widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === "refreshaction" || eventdata?.menuItemId === "refreshgriditem") {
			this.eventbus.dispatch('contentsRefreshRequest', this, { elementheight: this.getBodyElementHeight() });
		} else if (eventdata?.menuItemId === "closegriditem") {
			this.eventbus.dispatch('closegriditemRequest', this, { });	
		}
		
	}
	
	getBodyElementHeight() {
		return this.bodyelement.clientHeight; //- this.headerelement.clientHeight;
	}
	
	setContents(objRunResult) {
		if (objRunResult.PlotlyFigure) { 
			try {
				this.setInnerHtml(objRunResult.output);
				eval(this.bodyelement.querySelector('script')?.innerText);
			} catch (err) {
				console.error('Error initializing chart script',err);
			}
		} else {
			if (this.detectContents(objRunResult.output)==='svg') {
				this.setInnerHtml('<div class="svgvisual-container" style="width: 100%; height: 100%;">' + objRunResult.output + '</div>');
			} else {
				this.setInnerHtml(objRunResult.output);
			}
		}
	}
	
		
	detectContents(strContents) {
		let parser = new DOMParser();
		let xmlDoc = parser.parseFromString(strContents,"text/xml");
		const errorNode = xmlDoc.querySelector("parsererror");
		if (errorNode) {
		  return 'error';
		} 
		for (let i=0;i<xmlDoc.children.length;i++) {
			if (xmlDoc.children.item(i).tagName.toLowerCase() === 'svg') {
				return 'svg';
			}
		}
		return 'unknown';
	}
	
	
	
}
