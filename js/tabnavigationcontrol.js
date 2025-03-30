/**************
 *   Bootstrap 5 tab pane navigation control
 *   requires bootstrap
 * 
 * **************/

import { makeCloneFromTemplate } from "./utilities.js";

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
	
	addNewTab(TabControlClass, params) {   // pass tab's position?
		params.tabcontentelement = this.tabcontentelement;
		params.tabslistelement = this.tabslistelement;
		params.InsertBeforeNavItemContainer = null;
		// where to insert the tab?
		if (this.tabs.length>0) {
			params.InsertBeforeNavItemContainer = this.tabs[this.tabs.length-1].element; // ?? -- need to calc the position...
		}
		
		let newtab = new TabControlClass(params);
		// insert tabs in correct order
		
		this.tabs.splice(this.tabs.length-1,0,newtab); // insert before the last 
		
		newtab.init();
		
	}
	
}


export class BaseTabControl {

	constructor (params) {
		//  tab body
		this.templateid = params.templateid;
		//this.containerid = params.containerid;
		this.uuid = self.crypto.randomUUID();	
		//this.internalContainer = document.querySelector(this.containerid);
		this.internalContainer = params.tabcontentelement;
		const clone = makeCloneFromTemplate(this.templateid, this.uuid);
		this.internalContainer.appendChild(clone);
		
		//  nav item (tab headers)
		this.navitemtemplateid = params.navitemtemplateid;
		//this.navitemcontainerid = params.navitemcontainerid;
		//this.NavItemInternalContainer  = document.querySelector(this.navitemcontainerid);
		this.NavItemInternalContainer = params.tabslistelement;
		
		this.InsertBeforeNavItemInternalContainer = params.InsertBeforeNavItemContainer; 
		
		const navitemclone = makeCloneFromTemplate(this.navitemtemplateid, this.uuid);
		this.NavItemInternalContainer.insertBefore(navitemclone, this.InsertBeforeNavItemInternalContainer);
		
		this.tabnavelement = this.NavItemInternalContainer.querySelector('#tabnavlink'+this.uuid);
		let originalval = this.tabnavelement.getAttribute('data-bs-target');
		this.tabnavelement.setAttribute('data-bs-target', `${originalval}${uuid}`);
		originalval = this.tabnavelement.getAttribute('aria-controls');
		this.tabnavelement.setAttribute('aria-controls', `${originalval}${uuid}`);
		
		this.element = this.NavItemInternalContainer.querySelector('#navitem'+this.uuid);
	}
	
	init() {
	/*
		const triggerTabList = document.querySelectorAll('#myTab button')
		triggerTabList.forEach(triggerEl => {
		  const tabTrigger = new bootstrap.Tab(triggerEl)

		  triggerEl.addEventListener('click', event => {
			event.preventDefault()
			tabTrigger.show()
		  })
		})
		
		
		then:
		bootstrap.Tab.getInstance(triggerEl).show()
	*/	
		const tabTrigger = new bootstrap.Tab(this.tabnavelement);

		triggerEl.addEventListener('click', event => {
			event.preventDefault();
			tabTrigger.show();
		})
		
	}
	
}
