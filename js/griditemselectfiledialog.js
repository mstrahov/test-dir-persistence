/**********
 * gridItemSelectFileDialog
 * depends: Tabulator.js
 * extends gridItemFileDialog adding file selection features for selecting files inside the script
 * 
 ***********************************   */
import { gridItemFileDialog } from "./griditemfiledialog.js";
import { FileUploadButton } from "./filedialogs.js";

export class gridItemSelectFileDialog extends gridItemFileDialog {
	
	constructor (params) {
		super(params);
		
	}

	async init() {
		let filetree = await this.fileIOHandler.genFileTreePyFS(this.fileIOHandler.APP_ROOT_DIR);
		let that = this;
		this.tabulatorProperties = {
			//height:"311px", 
			movableRows:false,
			reactiveData:false, 
			columns:[
				{title:"Name", field:"name", editor:false, headerSort:true, headerFilter:"input", headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),width:250, },
				{title:"Pick", field:"pick", editor:true,headerSort:false,
					formatter:"tickCross", 
					 hozAlign:"center", 
					formatterParams:{
						allowEmpty:true,
						allowTruthy:true,
					},
					cellEdited:function(cell){
							const row = cell.getRow();
							const rowdata = row.getData();
							if (rowdata.type === 'directory') {
								row.treeToggle();
							}
							console.log(rowdata);
							row.toggleSelect();
							
							row.update({"pick":null}); 
							(async (text)=> {await navigator.clipboard.writeText(text);})(rowdata.fullpath);
							//console.log(cell);
					 },
				},
				{title:"Last change", field:"modificationDate", editor:false, headerFilter:"datetime",  headerFilterFunc:this.customHeaderFilterDate.bind(this), headerSort:true, hozAlign:"left",
					sorter:"datetime",
					formatter:"datetime",
					formatterParams:{
						//inputFormat:"yyyy-MM-dd HH:ss",
						outputFormat:"yyyy-MM-dd TT", //  "D TT", 
						invalidPlaceholder:"",
					},
					width:160,},
				{title:"Size", field:"sizeBytes", hozAlign:"right", editor:false, 
						headerSort:true, sorter:"number",
						headerFilter:this.minMaxFilterEditor.bind(this),
						headerFilterFunc:this.minMaxFilterFunction.bind(this),
						headerFilterLiveFilter:false,},
				{title:"Type", field:"filetype", editor:false, 
						headerSort:true, 
						headerFilter:"input",
						headerFilterFunc:this.customHeaderIncludesStringFunction.bind(this),
				},
				
				// 
			],
			data:filetree,
			dataTree:true,
			dataTreeFilter:true,
			dataTreeStartExpanded:false,
			dataTreeChildIndent:27,
			dataTreeElementColumn:"name", 
			selectableRows:1,
			selectableRowsPersistence:false,
			selectableRowsCheck:function(row){
				return row.getData().type==='file'; //allow selection of rows with files only
			},
			rowContextMenu:[
				{
					label:"Copy path to clipboard",
					action:function(e, row){
						console.log(row.getData());
						(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
					}
				},
				{
					label:"Save file as ...",
					action:function(e, row){
						console.log(row.getData());
						(async (path)=> {await that.filesaveasdialog.downloadFromFSPath(path); })(row.getData().fullpath);
					}
				},
				{
					label:"Import to dataframe",
					action:function(e, row){
						console.log("Import file ...",row.getData().filetype, row.getData().fullpath );
						that.eventbus.dispatch('importfiletodf', that, {fullpath: row.getData().fullpath, filetype: row.getData().filetype   });
					}
				},
				
			],
			
		};
					
		this.tabulatorObj = new Tabulator(this.bodyelement, this.tabulatorProperties);
				
		this.tabulatorObj.on("rowDblClick", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		this.tabulatorObj.on("rowDblTap", function(e, row){
			//e - the click event object
			//row - row component
			console.log(row.getData()); 
			(async (text)=> {await navigator.clipboard.writeText(text);})(row.getData().fullpath);
		});
		
		
		
		this.fileuploaddialog = new FileUploadButton({containertemplateid: "#hiddenuploadbuttontemplate", containerid:"#fileuploaddialogplaceholder"+this.uuid,  fileSystemHandler: this.fileIOHandler });
		this.dropdownMenuControl.eventbus.subscribe('menuitemclick',this.menuEventHandler.bind(this));
		this.eventbus.subscribe('clickableactionclick',this.menuEventHandler.bind(this));
		
	}

}

