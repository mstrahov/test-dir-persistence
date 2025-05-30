/*******************
 * Grid item to be created in grid stack
 * IFrame output widget
 * depends: bootstrap
 *
 * 
 * ****************************/
import { GridItemWithMenu } from "./griditemwithmenu.js";

export class GridItemIFrameOutput extends GridItemWithMenu {

	constructor (params) {
		super(params);
		this.iframeElement = this.getElementByTemplateID('iframeelement');   
	}
	
	
	init() {
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
	}
	
	menuEventHandler(obj,eventdata) {
		console.log("GridItemIFrameOutput widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'refreshaction') {
			this.eventbus.dispatch('contentsRefreshRequest', this, { });
		}
		
	}
	
	setContents(strSrc) {
		if (this.detectContents(strSrc)==='svg') {
			strSrc = '<div class="svg-container" style="width: 100%;height: 100%;">' + strSrc + '</div>';
		}
		this.iframeElement.srcdoc=strSrc;
	}
	
	detectContents(strSrc) {
		let parser = new DOMParser();
		let xmlDoc = parser.parseFromString(strSrc,"text/xml");
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
