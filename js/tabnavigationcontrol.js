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
	
	addNewTab(params) {
		
	}
	
}


export class TabControl {

	constructor (params) {
		//  tab body
		this.templateid = params.templateid;
		this.containerid = params.containerid;
		this.uuid = self.crypto.randomUUID();	
		this.internalContainer = document.querySelector(this.containerid);
		const clone = makeCloneFromTemplate(this.templateid, this.uuid);
		this.internalContainer.appendChild(clone);
		
		//  nav item (tab headers)
		this.navitemtemplateid = params.navitemtemplateid;
		this.navitemcontainerid = params.containerid;
		this.NavItemInternalContainer  = document.querySelector(this.navitemcontainerid);
		
		this.InsertBeforeNavItemContainerid = params.InsertBeforeNavItemContainerid;
		this.InsertBeforeNavItemInternalContainer = null; 
		if (this.InsertBeforeNavItemContainerid) {
			this.InsertBeforeNavItemInternalContainer = document.querySelector(this.InsertBeforeNavItemContainerid);
		}
		
		const navitemclone = makeCloneFromTemplate(this.navitemtemplateid, this.uuid);
		this.naviteminternalContainer.insertBefore(navitemclone, this.InsertBeforeNavItemInternalContainer);
		
		this.tabnavelement = this.naviteminternalContainer.querySelector('#tabnavlink'+this.uuid);
		let originalval = this.tabnavelement.getAttribute('data-bs-target');
		this.tabnavelement.setAttribute('data-bs-target', `${originalval}${uuid}`);
		originalval = this.tabnavelement.getAttribute('aria-controls');
		this.tabnavelement.setAttribute('aria-controls', `${originalval}${uuid}`);
		
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
