/**************
 *   Bootstrap 5 dropdown menu events control 
 *   requires bootstrap
 * parameter - id of the  class="dropdown-menu" element, holding .dropdown-item elements
 * adds onclick event handlers, dispatches events when menu item is clicked
 * 
 * **************/
import EventBus from "./eventbus.js";

export class MenuEventsControl {
	#dropDownMenuElementId;
	#dropDownMenuContainer;
	#parentUUID;
	#multiLevelMenu;   // pass true in parameters to auto close all menus to previous levels closing
	
	constructor (params) {
		this.#dropDownMenuElementId = params.dropDownMenuElementId;
		this.#parentUUID = params.parentUUID || '';
		this.#multiLevelMenu = params.multiLevelMenu || 0;
		this.#dropDownMenuContainer = document.querySelector(this.#dropDownMenuElementId);
		this.eventbus = new EventBus(this);
		const dropdownitems = this.#dropDownMenuContainer.querySelectorAll('.dropdown-item');
		
		dropdownitems.forEach(menuitem => {
			//console.log("menuitem ",menuitem);
			// ignore dropdown-toggle in case menus contain submenus   
			// ignore adhocdb-switchitem - handled by bootstrap
			if (!menuitem.classList.contains('dropdown-toggle') && !menuitem.classList.contains('adhocdb-switchitem')) {
				menuitem.addEventListener("click", this.onClickEvent.bind(this));
			}
		},this);
		 
	}
	
	get parentUUID() {
		return this.#parentUUID;
	}
	
	onClickEvent(evt) {
		evt.preventDefault();
		let menuItemId =  evt.target.getAttribute('id');
		let menuItemText = evt.target.textContent;
		if (menuItemId && this.#parentUUID.length>0) {
			menuItemId = menuItemId.replace(this.#parentUUID, "");
		}
		//console.log("Menu clicked: ", this.#parentUUID, menuItemId, menuItemText);
		if (this.#multiLevelMenu) { 
			document.querySelectorAll('.dropdown-toggle').forEach(el => bootstrap.Dropdown.getInstance(el)?.hide());
		}
		this.eventbus.dispatch('menuitemclick',this,{parentUUID:this.#parentUUID, menuItemId:menuItemId, menuItemText:menuItemText});
	}
}
