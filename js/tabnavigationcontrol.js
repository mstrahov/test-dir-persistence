/**************
 *   Bootstrap 5 tab pane navigation control
 *   requires bootstrap
 * 
 * holds a list of active tabs in this.tabs
 * addNewTab - creates a tab of a specified type (e.g. BaseTabControl)
 * 
 * **************/
import { makeCloneFromTemplate } from "./utilities.js";
import EventBus from "./eventbus.js";

export class TabNavigationControl {
	#templateid;
	#uuid;
	#containerid;
	#internalContainer;
	
	constructor (params) {
		this.#templateid = params.templateid;
		this.#containerid = params.containerid;
		this.#uuid = self.crypto.randomUUID();	
		this.#internalContainer = document.querySelector(this.#containerid);
		const clone = makeCloneFromTemplate(this.#templateid, this.#uuid);
		this.#internalContainer.appendChild(clone);
		
		this.tabslistelement = this.#internalContainer.querySelector('#navtabs'+this.#uuid);
		this.tabcontentelement = this.#internalContainer.querySelector('#tabcontent'+this.#uuid);
		this.tabs = [];
		//  new bootstrap.Tab(container.querySelector('#myTab button:first-child'));
		//const bsTab = new bootstrap.Tab('#myTab');
	}
	
	addNewTab(TabControlClass, tabcontrolparams) {   // pass tab's position?
		let params = {...tabcontrolparams};
		params.tabcontentelement = this.tabcontentelement;
		params.tabslistelement = this.tabslistelement;
		let newtabpos = params.insertBeforePosition?params.insertBeforePosition:0; 
		if (newtabpos<0) {
			newtabpos = this.tabs.length + newtabpos; 
			if (newtabpos<0) {
				newtabpos = 0; 
			}
		}
		
		if (newtabpos>this.tabs.length) {
			newtabpos = this.tabs.length; 
		}
		
		params.InsertBeforeNavItemContainer = null;   // insert at the end of the list by default
		// where to insert the tab
		if (this.tabs.length>0 && newtabpos<this.tabs.length && newtabpos>=0) {
			params.InsertBeforeNavItemContainer = this.tabs[newtabpos].element;
		}
		
		let newtab = new TabControlClass(params);
		this.tabs.splice(newtabpos,0,newtab);
		
		newtab.init();
		newtab.show();
		
		return newtab;
	}
	// ---------------
	destroyTab(tabobj) {
		let tabind = this.tabs.findIndex((v)=>v===tabobj);
		tabobj.destroy();
		this.tabs.splice(tabind, 1);
	}
	
	
}


export class BaseTabControl {

	constructor (params) {
		//  tab body
		this.templateid = params.templateid;	
		this.internalContainer = params.tabcontentelement;
		
		this.uuid = self.crypto.randomUUID();
		const clone = makeCloneFromTemplate(this.templateid, this.uuid);
		this.internalContainer.appendChild(clone);
		
		//  nav item (tab headers)
		this.navitemtemplateid = params.navitemtemplateid;
		this.NavItemInternalContainer = params.tabslistelement;
		this.InsertBeforeNavItemInternalContainer = params.InsertBeforeNavItemContainer; 
		
		const navitemclone = makeCloneFromTemplate(this.navitemtemplateid, this.uuid);
		// If InsertBeforeNavItemInternalContainer is null, then new node is inserted at the end of NavItemInternalContainer
		this.NavItemInternalContainer.insertBefore(navitemclone, this.InsertBeforeNavItemInternalContainer);
		
		this.tabnavelement = this.NavItemInternalContainer.querySelector('#tabnavlink'+this.uuid);
		let originalval = this.tabnavelement.getAttribute('data-bs-target');
		this.tabnavelement.setAttribute('data-bs-target', `${originalval}${this.uuid}`);
		originalval = this.tabnavelement.getAttribute('aria-controls');
		this.tabnavelement.setAttribute('aria-controls', `${originalval}${this.uuid}`);
		
		this.TabNavTitleElement = this.NavItemInternalContainer.querySelector('#tabnavtitle'+this.uuid);
		this.TabBodyElement = this.internalContainer.querySelector('#tabbody'+this.uuid);
		this.element = this.NavItemInternalContainer.querySelector('#navitem'+this.uuid);
		if (!this.element) {
			console.error('id="navitem" is missing in template: ', this.navitemtemplateid);
		}
		
		// set tab title and body if present.
		if (params.tabtitle) {
			this.setTitle(params.tabtitle);
		}
		if (params.tabbody) {
			this.setBody(params.tabbody);
		}
		
	}
	
	init() {
		const tabTrigger = new bootstrap.Tab(this.tabnavelement);
		const that=this;
		this.tabnavelement.addEventListener('click', event => {
			event.preventDefault();
			//console.log("Click on tab: ", that.TabNavTitleElement.textContent);
			tabTrigger.show();
		});
		this.tabnavelement.addEventListener('shown.bs.tab', this.tabShown.bind(this));
	}
	
	tabShown(event) {
		// event.target // newly activated tab
		  // event.relatedTarget // previous active tab
		// console.log("Shown tab: ", this.TabNavTitleElement.textContent);
	}
	
	show() {
		bootstrap.Tab.getInstance(this.tabnavelement).show();
	}
	
	setTitle(innerhtml) {
		this.TabNavTitleElement.innerHTML = innerhtml;
	}
	
	setTitleToolTip(innerhtml) {
		this.TabNavTitleElement.title = innerhtml;
	}
		
	setBody(innerhtml) {
		this.TabBodyElement.innerHTML = innerhtml;
	}
	
	get TabNavTitleElementId() {
		return this.TabNavTitleElement.getAttribute('id');
	}
	
	get TabNavTitleElementSelector() {
		return '#' + this.TabNavTitleElement.getAttribute('id');
	}
	
	get BodyElementId() {
		return this.TabBodyElement.getAttribute('id');
	}
	
	destroy() {
		bootstrap.Tab.getInstance(this.tabnavelement)?.dispose();
		this.tabnavelement.remove();
		this.TabBodyElement.remove(); 
		this.element.remove(); 
	}
	
}



export class DropDownTabControl {

	constructor (params) {
		//  tab body
		//~ this.templateid = params.templateid;	
		//~ this.internalContainer = params.tabcontentelement;
		
		this.uuid = self.crypto.randomUUID();
		//~ const clone = makeCloneFromTemplate(this.templateid, this.uuid);
		//~ this.internalContainer.appendChild(clone);
		
		//  nav item (tab headers)
		this.navitemtemplateid = params.navitemtemplateid;
		this.NavItemInternalContainer = params.tabslistelement;
		this.InsertBeforeNavItemInternalContainer = params.InsertBeforeNavItemContainer; 
		
		const navitemclone = makeCloneFromTemplate(this.navitemtemplateid, this.uuid);
		// If InsertBeforeNavItemInternalContainer is null, then new node is inserted at the end of NavItemInternalContainer
		this.NavItemInternalContainer.insertBefore(navitemclone, this.InsertBeforeNavItemInternalContainer);
		
		this.tabnavelement = this.NavItemInternalContainer.querySelector('#tabnavlink'+this.uuid);
		//~ let originalval = this.tabnavelement.getAttribute('data-bs-target');
		//~ this.tabnavelement.setAttribute('data-bs-target', `${originalval}${this.uuid}`);
		//~ originalval = this.tabnavelement.getAttribute('aria-controls');
		//~ this.tabnavelement.setAttribute('aria-controls', `${originalval}${this.uuid}`);
		
		this.TabNavTitleElement = this.NavItemInternalContainer.querySelector('#tabnavtitle'+this.uuid);
		//~ this.TabBodyElement = this.internalContainer.querySelector('#tabbody'+this.uuid);
		this.element = this.NavItemInternalContainer.querySelector('#navitem'+this.uuid);
		if (!this.element) {
			console.error('id="navitem" is missing in template: ', this.navitemtemplateid);
		}
		
		// set tab title and body if present.
		if (params.tabtitle) {
			this.setTitle(params.tabtitle);
		}
		//~ if (params.tabbody) {
			//~ this.setBody(params.tabbody);
		//~ }
		
	}
	
	init() {
		//~ const tabTrigger = new bootstrap.Tab(this.tabnavelement);
		//~ this.tabnavelement.addEventListener('click', event => {
			//~ event.preventDefault();
			//~ tabTrigger.show();
		//~ });
		//~ this.tabnavelement.addEventListener('shown.bs.tab', this.tabShown.bind(this));
	}
	
	//~ tabShown(event) {
		//~ // event.target // newly activated tab
		  //~ // event.relatedTarget // previous active tab
		//~ console.log("Shown tab: ", this.TabNavTitleElement.textContent);
	//~ }
	
	show() {
		//~ bootstrap.Tab.getInstance(this.tabnavelement).show();
	}
	
	setTitle(innerhtml) {
		this.TabNavTitleElement.innerHTML = innerhtml;
	}
	
	//~ setBody(innerhtml) {
		//~ this.TabBodyElement.innerHTML = innerhtml;
	//~ }
	
	get TabNavTitleElementId() {
		return this.TabNavTitleElement.getAttribute('id');
	}
	
	get TabNavTitleElementSelector() {
		return '#' + this.TabNavTitleElement.getAttribute('id');
	}
	
	get DropDownMenuElementSelector() {
		return '#' + this.element.querySelector('.dropdown-menu')?.getAttribute('id');
	}
	
	//~ get BodyElementId() {
		//~ return this.TabBodyElement.getAttribute('id');
	//~ }
	
	destroy() {
		
		this.tabnavelement.remove();
		//this.TabBodyElement?.remove(); 
		this.element.remove(); 
	}
	
}
