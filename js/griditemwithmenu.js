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
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.headerControlEventHandler.bind(this));
		
		// clickable-item-action - top svg action items events:
		
		this.eventbus = new EventBus(this);
		const clickableitems = this.headerelement.querySelectorAll('.clickable-item-action');
		clickableitems.forEach(menuitem => {
			//console.log("menuitem ",menuitem);
			menuitem.addEventListener("click", this.onClickClickableActionEvent.bind(this));
		},this);
		this.eventbus.subscribe('clickableactionclick',this.headerControlEventHandler.bind(this));
		
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
		console.log("widget",this.__proto__?.constructor?.name, this.headerText, "drop down menu item click",obj,eventdata); 
		
		//~ if (eventdata?.menuItemId === 'compactview') {
			//~ this.grid.compact();
		//~ } else if (eventdata?.menuItemId === 'savelayout') {
			//~ console.log(this.layoutToJSON());
		//~ }
		
	}
	
}

