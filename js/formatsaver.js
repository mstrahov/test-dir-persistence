/**
 *  Interface for storing blobs in sqlite file
 * 
 * */
import { FileSystemHandler } from "./fileshandlers.js";

const FILE_EXTENSION = "dbsqlite";

export class FormatSaver {
	#pyodidePromise;
	#pyodide;
	#dbfilename;
	#fshandler;
	
	constructor(params) {
		this.#pyodidePromise = params.pyodidePromise;
		this.#pyodide = undefined;
		this.#dbfilename = params.dbFileName;
		this.#fshandler = new FileSystemHandler({pyodidePromise: this.#pyodidePromise});
	}
	
	// ------------------------------------------------
	async init() {
		window.exectimer.timeit("initializing internal format saver...");
		this.#pyodide = await this.#pyodidePromise;
		//~ await this.#pyodide.loadPackage("sqlite3");
		try {
			let output = await this.#pyodide.runPythonAsync(`
import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('sqlite3')
import sqlite3
`);
		} catch (err) {
			console.error('Error initializing sqlite3',err);
		}
		window.exectimer.timeit("done!");
	}
	
	// ------------------------------------------------
	async openConn() {
		const cmd = `
conn_internal = sqlite3.connect("${this.#dbfilename}")
conn_internal.execute('''
    CREATE TABLE IF NOT EXISTS tbl_objects (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        objtype TEXT NOT NULL,
        datahash TEXT,
        timestamp TEXT, 
        data BLOB
    );
''')
conn_internal.execute('''
    CREATE UNIQUE INDEX IF NOT EXISTS uniqnametype ON tbl_objects (name,objtype);
''')
`;
		if (!this.#pyodide) { await this.init(); }

		try {
			let output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error opening internal file connection',this.#dbfilename,err);
		}
	}

	// ------------------------------------------------
	async closeConn() {
		const cmd = `
conn_internal.commit()
conn_internal.close()
`;
		try {
			let output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error closing internal file connection',this.#dbfilename,err);
		}
		
		await this.#fshandler.syncFS();
	}
	
	// ------------------------------------------------
	
	async writeObjectFromString(name, objtype, stringval){
		window.exectimer.timeit("writing object from string...");
		const cmd = `
filedata_01 = b'''${stringval}'''	
conn_internal.execute('''
    INSERT INTO tbl_objects (name, objtype, data)
    VALUES (?, ?, ?)
    ON CONFLICT(name, objtype) DO UPDATE SET data=excluded.data;	
''', ('${name}','${objtype}', sqlite3.Binary(filedata_01)))
`;	

		await this.openConn();
		try {
			let output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error writing object from string value',this.#dbfilename,name,objtype,err);
		}
		await this.closeConn();
		window.exectimer.timeit("done!");
	}
	
	// ------------------------------------------------
	async writeObjectFromFile(name, objtype, filename){
		window.exectimer.timeit("writeObjectFromFile...");
		const cmd = `
with open('${filename}', 'rb') as f:
    filedata_01 = f.read()			
conn_internal.execute('''
    INSERT INTO tbl_objects (name, objtype, data)
    VALUES (?, ?, ?)
    ON CONFLICT(name, objtype) DO UPDATE SET data=excluded.data;	
''', ('${name}','${objtype}', sqlite3.Binary(filedata_01)))
`;
		if (! await this.#fshandler.pathExists(filename)) {
			console.error('File does not exist: ', filename);
			return;
		}
		
		await this.openConn();
		try {
			let output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error writing object from file',this.#dbfilename,name,objtype,err);
		}
		await this.closeConn();
		window.exectimer.timeit("done!");
	}
	
	// ------------------------------------------------
	
	async readObjectToString(name, objtype){
		window.exectimer.timeit("readObjectToString...");
		const cmd = `
conn_curs = conn_internal.execute('''
	SELECT data FROM tbl_objects WHERE name=? AND objtype=?;
''',('${name}','${objtype}'))
conn_internal_data = conn_curs.fetchone()[0]
conn_curs.close()
conn_internal_data.decode()
`;
		let output = undefined;
		await this.openConn();
		try {
			output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error reading object from file',this.#dbfilename,name,objtype,err);
		}
		await this.closeConn();
		window.exectimer.timeit("done!");
		return output;
		
	}
	
	// ------------------------------------------------
	
	async readObjectToFile(name, objtype,filename){
		window.exectimer.timeit("readObjectToFile...");
		const cmd = `
conn_internal_data = conn_internal.execute('''
	SELECT data FROM tbl_objects WHERE name=? AND objtype=?;
''',('${name}','${objtype}')).fetchone()[0]
with open('${filename}', 'wb') as file:
    file.write(conn_internal_data)
`;
		let output = undefined;
		await this.openConn();
		try {
			output = await this.#pyodide.runPythonAsync(cmd);
		} catch (err) {
			console.error('Error reading object to file',this.#dbfilename,name,objtype,filename,err);
		}
		await this.closeConn();
		window.exectimer.timeit("done!");
		return output;
		
	}
	
}   // end of class FormatSaver
