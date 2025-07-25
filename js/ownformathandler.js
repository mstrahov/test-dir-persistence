/**
 *  Interface for storing blobs in sqlite file
 * 
 * */
//import { FileSystemHandler } from "./fileshandlers.js";
import EventBus from "./eventbus.js";

const FILE_EXTENSION = "adhocdb";

export class OwnFormatHandler {
	#pyodidePromise;
	#pyodide;
	#dbfilename;
	#iohandler;
	
	constructor(params) {
		this.FORMAT_VERSION = "0.1";
		this.eventbus = new EventBus();
		this.#pyodidePromise = params.pyodidePromise;
		this.#pyodide = undefined;
		this.#dbfilename = params.dbFileName;
		this.#iohandler = params.FileIOHandler;
		this.namespaceuuid = params.namespaceuuid;
		this.coderunner = params.coderunner;
		this.scriptsarr = [];
		this.iostate = '';
	}
	
	
	// ------------------------------------------------------------------------------------------------------------------------
	get dbfilename() {
		return this.#dbfilename;
	}
	
	// -----------------------------------------------------------------------------------------------------
	_statechange(newstate, addmessage='', params={}) {
		this.iostate = newstate;
		
		if (params?.error) {
			console.error(addmessage, params);
		} else {
			console.log(addmessage, params);
		}
		
		this.eventbus.dispatch('statechange',this,{state:newstate, message:addmessage, lengthmilli:params?.lengthmilli||0, lengthseconds: params?.lengthseconds||0,  ...params } );
	}
	// -----------------------------------------------------------------------------------------------------
	async init() {
		//window.exectimer.timeit("initializing internal format saver...");
		this.#pyodide = await this.#pyodidePromise;
		await this.#iohandler.FileIOinitialized();
		try {
			//~ let output = await this.#pyodide.runPythonAsync(`
//~ import pyodide_js
//~ await pyodide_js.loadPackage('micropip')
//~ import micropip
//~ await micropip.install('sqlite3')
//~ import sqlite3
//~ `);
		let output = await this.coderunner.runPythonAsync(`
import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('sqlite3')
import sqlite3
`, this.namespaceuuid);
		} catch (err) {
			console.error('Error initializing sqlite3',err);
		}
		//window.exectimer.timeit("done!");
	}
	
	// -----------------------------------------------------------------------------------------------------
	async openConn() {
		const cmd = `
conn_internal = sqlite3.connect("${this.#dbfilename}")
conn_internal.execute('''
    CREATE TABLE IF NOT EXISTS tbl_objects (
        id INTEGER PRIMARY KEY,
        name TEXT,
        objuuid TEXT NOT NULL,
        objtype TEXT NOT NULL,
        datahash TEXT,
        modtimestamp TEXT DEFAULT CURRENT_TIMESTAMP, 
        data BLOB
    );
''')
conn_internal.execute('''
    CREATE UNIQUE INDEX IF NOT EXISTS uniqnametype ON tbl_objects (objuuid, objtype);
''')
`;
		if (!this.#pyodide) { await this.init(); }
		await this.#iohandler.FileIOinitialized();
		try {
			//~ let output = await this.#pyodide.runPythonAsync(cmd);
			
			let output = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			
		} catch (err) {
			console.error('Error opening internal file connection',this.#dbfilename,err);
		}
	}

	// -----------------------------------------------------------------------------------------------------
	async closeConn() {
		const cmd = `
conn_internal.commit()
conn_internal.close()
`;
		if (!this.#pyodide) { await this.init(); }
		await this.#iohandler.FileIOinitialized();
		try {
			//~ let output = await this.#pyodide.runPythonAsync(cmd);
			let output = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
		} catch (err) {
			console.error('Error closing internal file connection',this.#dbfilename,err);
		}
		
		await this.#iohandler.syncFS();
	}
	
	// -----------------------------------------------------------------------------------------------------
	async syncFS() {
		await this.#iohandler.syncFS();
	}
	// -----------------------------------------------------------------------------------------------------
	
	async writeObjectFromString(name, objuuid, objtype, stringval){
		//window.exectimer.timeit("writing object from string...");
		//~ const cmd = `
//~ filedata_01 = b'''${stringval}'''	
//~ conn_internal.execute('''
    //~ INSERT INTO tbl_objects (name, objuuid, objtype, data)
    //~ VALUES (?, ?, ?, ?)
    //~ ON CONFLICT(objuuid, objtype) DO UPDATE SET name=excluded.name, data=excluded.data, modtimestamp = CURRENT_TIMESTAMP;	
//~ ''', ('${name}', '${objuuid}', '${objtype}', sqlite3.Binary(filedata_01)))
//~ del filedata_01
//~ `;	

		const cmd = `
from js import filedata_01 
conn_internal.execute('''
    INSERT INTO tbl_objects (name, objuuid, objtype, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(objuuid, objtype) DO UPDATE SET name=excluded.name, data=excluded.data, modtimestamp = CURRENT_TIMESTAMP;	
''', ('${name}', '${objuuid}', '${objtype}', sqlite3.Binary(filedata_01.to_py())))
`;	
		if (!this.#pyodide) { await this.init(); }
		await this.#iohandler.FileIOinitialized();
		
		const encoder = new TextEncoder();
		self.globalThis.filedata_01 = encoder.encode(stringval);
		await this.openConn();
		try {
			//~ let output = await this.#pyodide.runPythonAsync(cmd);
			let output = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
		} catch (err) {
			console.error('Error writing object from string value',this.#dbfilename,name,objuuid,objtype,err);
		}
		await this.closeConn();
		//window.exectimer.timeit("done!");
	}
	
	// -----------------------------------------------------------------------------------------------------
	async writeObjectFromFile(name, objuuid, objtype, filename){
		//window.exectimer.timeit("writeObjectFromFile...");
		const cmd = `
with open('${filename}', 'rb') as f:
    filedata_01 = f.read()			
conn_internal.execute('''
    INSERT INTO tbl_objects (name, objuuid, objtype, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(objuuid, objtype) DO UPDATE SET name=excluded.name, data=excluded.data, modtimestamp = CURRENT_TIMESTAMP;
''', ('${name}','${objuuid}','${objtype}', sqlite3.Binary(filedata_01)))
del filedata_01
`;
		if (!this.#pyodide) { await this.init(); }
		await this.#iohandler.FileIOinitialized();
		
		if (!await this.#iohandler.pathExists(filename)) {
			console.error('File does not exist: ', filename);
			return;
		}
		
		await this.openConn();
		try {
			//~ let output = await this.#pyodide.runPythonAsync(cmd);
			let output = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
		} catch (err) {
			console.error('Error writing object from file',this.#dbfilename,name,objuuid,objtype,err);
		}
		await this.closeConn();
		//window.exectimer.timeit("done!");
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async readObjectToString(objuuid, objtype){
		//window.exectimer.timeit("readObjectToString...");
		const cmd = `
conn_curs = conn_internal.execute('''
	SELECT data FROM tbl_objects WHERE objuuid=? AND objtype=?;
''',('${objuuid}','${objtype}'))
conn_internal_data = conn_curs.fetchone()[0]
conn_curs.close()
conn_internal_data.decode()
`;
		
		let output = undefined;
		await this.openConn();
		try {
			//~ output = await this.#pyodide.runPythonAsync(cmd);
			let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			if (res.runStatus) {
				output = res.output;
			} else {
				console.error('Error reading object from file',this.#dbfilename, objuuid, objtype, res.error);
			}
			
		} catch (err) {
			console.error('Failed to read object from file',this.#dbfilename,objuuid,objtype,err);
		}
		await this.closeConn();
		//window.exectimer.timeit("done!");
		return output;
		
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async readObjectToFile(objuuid, objtype, filename){
		//window.exectimer.timeit("readObjectToFile...");
		const cmd = `
conn_internal_data = conn_internal.execute('''
	SELECT data FROM tbl_objects WHERE objuuid=? AND objtype=?;
''',('${objuuid}','${objtype}')).fetchone()[0]
with open('${filename}', 'wb') as file:
    file.write(conn_internal_data)
del conn_internal_data
`;
		let output = undefined;
		await this.openConn();
		try {
			//~ output = await this.#pyodide.runPythonAsync(cmd);
			let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			if (res.runStatus) {
				output = res.output;
			} else {
				console.error('Error reading object from file',this.#dbfilename, objuuid, objtype,filename, res.error);
			}
		} catch (err) {
			console.error('Failed to read object from file',this.#dbfilename,objuuid,objtype,filename,err);
		}
		await this.closeConn();
		//window.exectimer.timeit("done!");
		return output;
		
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async getObjTypeStats(){
		const cmd = `
conn_internal_data = conn_internal.execute('''
	SELECT objtype, count(objuuid) as objcount 
    FROM tbl_objects group by objtype order by objtype;
''').fetchall()
conn_internal_data
`;		
		let output = undefined;
		await this.openConn();
		try {
			let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			if (res.runStatus) {
				output = res.output.toJs();
			} else {
				console.error('Error reading object types from file',this.#dbfilename, res.error);
			}
		} catch (err) {
			console.error('Failed to read object types from file',this.#dbfilename, err);
		}
		await this.closeConn();
		return output;
		
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async getAllObjectsOfType(objtype){
		//~ const cmd = `
//~ conn_internal_data = conn_internal.execute('''
	//~ SELECT name, objuuid, data FROM tbl_objects 
    //~ WHERE objtype='${objtype}';
//~ ''').fetchall()
//~ data_output = []
//~ for item in conn_internal_data:
    //~ data_output.append([item[0],item[1],item[2].decode()]) 
//~ del conn_internal_data
//~ data_output
//~ `;		
		const cmd = `
conn_internal_data = conn_internal.execute('''
	SELECT name, objuuid, data FROM tbl_objects 
    WHERE objtype='${objtype}';
''').fetchall()
conn_internal_data
`;	
		let output = undefined;
		await this.openConn();
		try {
			let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			if (res.runStatus) {
				output = res.output.toJs();
			} else {
				console.error('Error reading object types from file',this.#dbfilename, res.error);
			}
		} catch (err) {
			console.error('Failed to read object types from file',this.#dbfilename, err);
		}
		await this.closeConn();
		return output;
		
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async deleteObjectByUuid(objuuid, objtype) {
		
		const cmd = `
conn_internal.execute('''
	DELETE FROM tbl_objects WHERE objuuid=? AND objtype=?;
''',('${objuuid}','${objtype}'))
`;
		let output = undefined;
		await this.openConn();
		try {
			let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
			if (res.runStatus) {
				output = res.output;
			} else {
				console.error('Error deleting object',this.#dbfilename, objuuid, objtype, res.error);
			}
		} catch (err) {
			console.error('Failed to delete object ',this.#dbfilename, objuuid, objtype, err);
		}
		await this.closeConn();
		return output;
		
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async deleteScript(objuuid) { 
		
		const ind1 = this.scriptsarr.findIndex((v)=>v.objuuid===objuuid);
		if (ind1>-1) {
			await this.deleteObjectByUuid(objuuid, 'script');
			this.scriptsarr.splice(ind1,1);
		}
	}
	
	// -----------------------------------------------------------------------------------------------------
	
	async getScriptsArrayFromOwnFormatFile(){
		let res = [];
		
		let scriptlist = await this.getAllObjectsOfType('script');
		if (!scriptlist) {
			console.error('Script list is not received from file!');
			return res;
		}
		for (let i=0;i<scriptlist.length;i++) {
			try {
				let scriptobj = JSON.parse((new TextDecoder()).decode(scriptlist[i][2]));
				res.push(scriptobj);
			} catch (err) {
				console.error('Script parsing from json error:',scriptlist[i],err);	
			}
			
		}
		
		return res;
	}
	
	
	// -----------------------------------------------------------------------------------------------------
	
	generateTabulatorTree() {
		let resTree = [];
		if (!this.scriptsarr || this.scriptsarr.length===0) {
			return resTree;
		}
		// nodeObj['_children'] 
		let scripttree = [];
		
		for (let i=0;i<this.scriptsarr.length;i++) {
			scripttree.push({   
				name: this.scriptsarr[i].name,
				isopen: this.scriptsarr[i].isopen,
				autorun: this.scriptsarr[i].autorun,
				runorder: this.scriptsarr[i].runorder,
				objtype: this.scriptsarr[i].objtype, 
				objuuid:  this.scriptsarr[i].objuuid,
				//visualwidgetsnum: this.scriptsarr[i].visualwidgets?.length,
				//gridwidgetsnum: this.scriptsarr[i].gridwidgets?.length,
				//scriptlength: this.scriptsarr[i].scriptObject?.transformSteps?.length, 
				lastRunResult: this.scriptsarr[i].scriptObject?.lastRunResult, 
				lastRunStatus: this.scriptsarr[i].scriptObject?.lastRunStatus, 
				_level: 1,
			});
		}
		
		resTree.push({
			name: 'Scripts',
			isopen: null,
			autorun: null,
			runorder: null,
			objtype: '', 
			objuuid:  '',
			//visualwidgetsnum: this.scriptsarr[i].visualwidgets?.length,
			//gridwidgetsnum: this.scriptsarr[i].gridwidgets?.length,
			//scriptlength: this.scriptsarr[i].scriptObject?.transformSteps?.length, 
			lastRunResult: '', 
			lastRunStatus: null, 
			_children: scripttree,
			_level: 0,
			
		}); 
		
		return resTree;
		
	}
	
	
	// -----------------------------------------------------------------------------------------------------
	updateScriptArrayData(eventdata) {
		// {fieldname: cell.getField(), oldvalue: cell.getOldValue(), newvalue:cell.getValue(), rowdata: cell.getData(), });
		const ind = this.scriptsarr.findIndex((val)=>val.objuuid===eventdata.rowdata.objuuid);
		if (ind>-1) {
			if (eventdata.fieldname==="runorder") {	
				this.scriptsarr[ind][eventdata.fieldname] = parseInt(eventdata.newvalue);
			} else if (eventdata.fieldname==="name") {	
				this.scriptsarr[ind][eventdata.fieldname] = eventdata.newvalue.trim();
				this.scriptsarr[ind]['scriptname'] = eventdata.newvalue.trim();
				this.scriptsarr[ind]['tabtitle'] = eventdata.newvalue.trim();
				
			} else {
				this.scriptsarr[ind][eventdata.fieldname] = eventdata.newvalue;
			}
		}
	
	}
	// -----------------------------------------------------------------------------------------------------
	
	async saveScriptData(scriptobj, isopenvalue=null) {
		let scriptownformat = scriptobj.toOwnFormat();
		const ind = this.scriptsarr.findIndex((val)=>val.objuuid===scriptownformat.objuuid);
		let scriptjson = '';
		
		if (ind>-1) {
			let savedproperties = ['isopen', 'autorun', 'runorder'];
			savedproperties.forEach(v=>scriptownformat[v]=this.scriptsarr[ind][v]);
			if (isopenvalue!==null) {
				scriptownformat.isopen = isopenvalue;
			}
			scriptjson = JSON.stringify(scriptownformat);
			this.scriptsarr[ind] = JSON.parse(scriptjson);
		} else {
			scriptownformat.isopen = isopenvalue!==null?isopenvalue:true;
			scriptownformat.autorun = true;
			scriptownformat.runorder = (this.scriptsarr.length+1)*10;
			scriptjson = JSON.stringify(scriptownformat);
			this.scriptsarr.push(JSON.parse(scriptjson));
		}
		console.log("script saved: ", scriptownformat);
		await this.writeObjectFromString(scriptownformat.name, scriptownformat.objuuid, scriptownformat.objtype, scriptjson);
		
	}
	
	// -------------------------------------------------------------------------------------------------------
	
	async saveScriptByUuid(objuuid, isopenvalue=null) {
		const ind = this.scriptsarr.findIndex((val)=>val.objuuid===objuuid);
		if (ind>-1) {
			await this.writeObjectFromString(this.scriptsarr[ind].name, this.scriptsarr[ind].objuuid, this.scriptsarr[ind].objtype, JSON.stringify(this.scriptsarr[ind]));
		}
	}
	// -------------------------------------------------------------------------------------------------------
	
	async exportDuckbToDirPath(dirPath) {
		
		let containerDirHandle = await this.#iohandler.findOrCreateDirectoryHandleByFilePath(dirPath);
		await this.exportDuckbToDir(containerDirHandle);
		
	}
	
	// -------------------------------------------------------------------------------------------------------
	
	async exportDuckbToDir(containerDirHandle) {
		//~ EXPORT DATABASE 'exportdb' (FORMAT parquet, COMPRESSION zstd);
		//~ SELECT * FROM glob("*");
		//~ const buffer = await window.duckdb.db.copyFileToBuffer('exportdb/tbl_df.parquet');   // Uint8Array
		//~ await window.duckdb.db.dropFile('exportdb/tbl_df.parquet');   // const buffer = await this.#duckdbloader.db.copyFileToBuffer(this.duckdbfilehandles[ind].filename); 
		//~ let pyodide = await window.pyodideReadyPromise;
		//~ await pyodide.FS.writeFile('/app/tbl_df.parquet',buffer)
		
		const EXPORT_DIR_NAME = 'exportdb';
		if (!containerDirHandle) {
			return false;
		}
		
		const starttime = performance.now();   
		this._statechange('db_export_to_dir_start', `Starting database export to directory: ${containerDirHandle.name}/${EXPORT_DIR_NAME}`);

		
		try {
			
			if (containerDirHandle.kind!=='directory') {
				this._statechange('db_export_to_dir_error', `${containerDirHandle.name} must be a directory. Cannot export database!`);
				return false;
			}
			
			const permission = await containerDirHandle.queryPermission({mode: 'readwrite'});
			if (permission!=='granted') {
				this._statechange('db_export_to_dir_error', `Write permission is not granted for directory ${containerDirHandle.name}. Cannot export database!`);
				return false;
			}
			
		} catch (e) {
			this._statechange('db_export_to_dir_error', `Error checking permission on directory: ${containerDirHandle.name}. Cannot write to a directory!`);
			return false;
		}
		
		
		let exportDir;
		try {
			exportDir = await containerDirHandle.getDirectoryHandle(EXPORT_DIR_NAME, { create: true });
		} catch (e) {
			this._statechange('db_export_to_dir_error', `Error exporting database to: ${containerDirHandle.name}/${EXPORT_DIR_NAME}. Cannot create a directory!`, { error: e });
			return false;
		}	
		
		try {
			if (!(await (await exportDir.entries()).next()).done) {
				this._statechange('db_export_to_dir_error', `Error exporting database to: ${containerDirHandle.name}/${EXPORT_DIR_NAME}. Directory must be empty!`);
				return false;
			}	
		} catch (e) {
			this._statechange('db_export_to_dir_error', `Error exporting database, cannot open directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} !`, { error: e });
			return false;
		}
		
		await this.#iohandler.FileIOinitialized();
		let duckdbloader = await this.#iohandler.getduckdbloader();
		
		try {
			await this.coderunner.runSQLAsync(`CHECKPOINT;`); 
			await this.coderunner.runSQLAsync(`EXPORT DATABASE '${EXPORT_DIR_NAME}' (FORMAT parquet, COMPRESSION zstd);`);
			let qryres = await this.coderunner.runSQLAsync(`SELECT "file" FROM glob("${EXPORT_DIR_NAME}/*");`);
			
			if (qryres?.runResult) {
				this._statechange('db_export_to_dir_status', `Database exported to memory, total files: ${qryres?.output?.numRows}`);
				for (let i=0;i<qryres?.output?.numRows;i++) {
					const filename = qryres?.output?.get(i)['file']?.toString();
					const filenameShort = filename.replaceAll(`${EXPORT_DIR_NAME}/`,'');
					this._statechange('db_export_to_dir_status', `Database export, processing file: ${filename}`);
					const buffer = await duckdbloader.db.copyFileToBuffer(filename);
					
					const fileHandle = await exportDir.getFileHandle(filenameShort, { create: true });
					const writable = await fileHandle.createWritable();
					await writable.write(buffer);
					await writable.close();				
					
					await duckdbloader.db.dropFile(filename);
				}
			}
			
			
		} catch (e) {
			this._statechange('db_export_to_dir_error', `Error exporting database, cannot open directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} !`, { error: e });
			return false;
		}
		
		let lengthmilli = performance.now() - starttime;
		let lengthseconds = lengthmilli / 1000;
		// let executionTime = Math.round(res.lengthmilli)/1000;
		this._statechange('db_export_to_dir_success', `Export to directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} complete.`,
						{
							lengthmilli: lengthmilli,
							lengthseconds: lengthseconds/1000,
						}
					);
		
		return true;
	}
	
	// -------------------------------------------------------------------------------------------------------
	
	async importDuckbFromDir(containerDirHandle) {
		// container dir handle must be duckdb export directory
		// await sd01.queryPermission({mode: 'read'})
		// const fileName = file.name;
		// const fileData = new Uint8Array(await file.arrayBuffer());
		
		//~ if (containerDirHandle.kind!=='directory') {
			//~ this._statechange('db_export_to_dir_error', `${containerDirHandle.name} must be a directory. Cannot export database!`);
			//~ return false;
		//~ }
			
			
	}
	// -------------------------------------------------------------------------------------------------------
	
	async exportDuckbToOwnFormat() {
		
	}
	
	// -------------------------------------------------------------------------------------------------------
	
	async importDuckbFromOwnFormat() {
		
	}
	
	// -------------------------------------------------------------------------------------------------------
}   // end of class OwnFormatHandler
