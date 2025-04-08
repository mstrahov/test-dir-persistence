/*******************
 * AppPageControl - manages contents on one page/tab view with grid 
 * contains grid, can add controls to the grid, can save grid's layout settings
 * can restore grid
 * should have: destroy method - first destroys all elements it contains 
 * 
 * Requirements:  bootstrap5, gridstack.js
 * 
 * ****************************/
import EventBus from "./eventbus.js";
import { TabNavigationControl, BaseTabControl, DropDownTabControl } from "./tabnavigationcontrol.js";
import { MenuEventsControl } from "./menueventscontrol.js";


export class AppPageControl {
	constructor (params) {
		this.uuid = self.crypto.randomUUID();
		this.eventbus = new EventBus();
		
		// tabnavcontrol 
		this.tabnavcontrol = params.tabnavcontrol;
		this.baseTabControlType = params.baseTabControlType || BaseTabControl;
		this.insertBeforePosition = params.insertBeforePosition;
		
		// tab header template 
		this.navitemtemplateid  = params.navitemtemplateid;
		// tab body template
		this.templateid = params.templateid;
		this.tabtitle = params.tabtitle;
		
		
		// add tab with contents
		
		this.contenttab = this.tabnavcontrol.addNewTab(this.baseTabControlType, 
					{
						insertBeforePosition: this.insertBeforePosition, 
						templateid: this.templateid, 
						navitemtemplateid: this.navitemtemplateid, 
						tabtitle: this.tabtitle ,  
					});
		
		// tab context menu template
		this.DropDownMenuTemplateID = params.DropDownMenuTemplateID || null;
		this.dropdownMenuTab = null;
		this.dropdownMenuControl = null;
		if (this.DropDownMenuTemplateID) {
			// add top dropdownmenu
			let dropdownInsertBeforePos = this.insertBeforePosition; 
			if (this.insertBeforePosition>0) {
				dropdownInsertBeforePos++;
			}; 
			this.dropdownmenutab = this.tabnavcontrol.addNewTab(DropDownTabControl, {insertBeforePosition:dropdownInsertBeforePos,  navitemtemplateid: this.DropDownMenuTemplateID, });
			const menutabnavelement = this.dropdownmenutab.tabnavelement;
			// top dropdown can be toggled by right-click or long-press on tab's title 			
			this.contenttab.tabnavelement.addEventListener("contextmenu", (event)=>{
				event.preventDefault();
				bootstrap.Dropdown.getOrCreateInstance(menutabnavelement)?.toggle();
			});
			
			this.dropdownMenuControl = new MenuEventsControl({dropDownMenuElementId:this.dropdownmenutab.DropDownMenuElementSelector, parentUUID: this.dropdownmenutab.uuid, multiLevelMenu:false});
			this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.topDropDownEventHandler.bind(this));
		
		}
		
		// grid element init  https://github.com/gridstack/gridstack.js/tree/master/doc
		let opts = {
			  cellHeight: 'auto', // see other possible values (best to do in here)
			  cellHeightThrottle: 100,
			  handle: '.grid-elem-draggable' ,
			  margin: 1,
			  cellHeight: 80,
			  animate: true, // show immediate (animate: true is nice for user dragging though)
			  columnOpts: {
				layout: "moveScale",
				breakpointForWindow: true,  // test window vs grid size
				breakpoints: [{w:700, c:1}]
			  },
			  float: true,
		}
		
		this.grid = GridStack.init(opts,'#gridcontainer'+this.contenttab.uuid);
		//~ var items = [
			//~ {w: 6, h:5, content: 'Test widget number one'}, 
			//~ {w: 6, h:5, content: 'another longer widget!'} 
		//~ ];
		//~ this.grid.load(items);
		
		// list of grid items on a page
		this.gridItems = [];
		
	}
	
	init() {
		
	}
	
	addGridItem(gridItemType, gridItemParams) {
		// let item2 = new GridItem({templateid:"#gridelementtemplate", grid: grid, headertext: "chart 2", griditemoptions: {w:2,h:2,} });
		let params = {...gridItemParams};
		if (gridItemParams.griditemoptions) {
			params.griditemoptions = {...gridItemParams.griditemoptions};
		}
		params.grid = this.grid;
		let newgriditem = new gridItemType(params);
		this.gridItems.push(newgriditem);
		//newgriditem.init();   //??
		return newgriditem;
	}
	
	topDropDownEventHandler(obj,eventdata) {
		console.log("main drop down menu item click",obj,eventdata); 
		
		if (eventdata?.menuItemId === 'compactview') {
			this.grid.compact();
		} else if (eventdata?.menuItemId === 'savelayout') {
			console.log(this.layoutToJSON());
		}
		
	}
	
	destroy() {
		//  dropdownMenuControl - clear eventbus
		//  dropdownmenutab  - destroy
		
	}
	
	layoutToJSON() {
		// to save grid   grid.save(saveContent = false, saveGridOpt = true)
		let res = JSON.stringify(this.grid.save(false, true));
		return res;
	}
	
}
