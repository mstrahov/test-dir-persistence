/**
 *  Interface for storing blobs in sqlite file
 * 
 * */
//import { FileSystemHandler } from "./fileshandlers.js";
import EventBus from "./eventbus.js";

const FILE_EXTENSION = "dbsqlite";

export class OwnFormatHandler {
	#pyodidePromise;
	#pyodide;
	#dbfilename;
	#iohandler;
	
	constructor(params) {
		this.FORMAT_VERSION = "0.1";
		this.#pyodidePromise = params.pyodidePromise;
		this.#pyodide = undefined;
		this.#dbfilename = params.dbFileName;
		this.#iohandler = params.FileIOHandler;
		this.namespaceuuid = params.namespaceuuid;
		this.coderunner = params.coderunner;
		this.scriptsarr = [];
	}
	
	
	// ------------------------------------------------------------------------------------------------------------------------
	get dbfilename() {
		return this.#dbfilename;
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
	
	async getScriptsArrayFromOwnFormatFile(){
		let res = [];
		
		let scriptlist = await this.getAllObjectsOfType('script');
		for (let i=0;i<scriptlist.length;i++) {
			try {
				let scriptobj = JSON.parse((new TextDecoder()).decode(scriptlist[i][2]));
				res.push(scriptobj);
			} catch (err) {
				console.log('Script parsing from json error:',scriptlist[i],err);	
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
	
}   // end of class OwnFormatHandler
