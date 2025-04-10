/*******************************
 * DuckDB module loader
 * 
 * 
 * *********************************
 */
import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.1-dev76.0/+esm'; 
import EventBus from "./eventbus.js";
import { ExecTimer } from "./exectimer.js"; 


export class DuckDBLoader {
	#defer;
	#resolve;
	#reject;
	constructor(params) {
		
		this.eventbus = new EventBus(this);
		this.state = 'not_loaded';
		this.#defer = new Promise((res, rej) => {
			this.#resolve = res;
			this.#reject = rej;
		});
		this.duckdb = duckdb;
		this.conn = undefined;
		this.db = undefined;
		this.worker = undefined;
		this.logger = undefined;
		this.dbconnectionpath = 'opfs://mainapp.db';
		this.exectimer = new ExecTimer('DuckDB Loader Started...');
	}
	
	_statechange(newstate, addmessage='', params) {
		
		this.state = newstate;
		const lengthmilli = this.exectimer.timeit(`DuckDB Loader: ${newstate}`);
		const lengthseconds = this.exectimer.millitosec(lengthmilli);
		console.log(addmessage, params);
		this.eventbus.dispatch('dbstatechange',this,{state:newstate, message:addmessage, lengthmilli:lengthmilli, lengthseconds: lengthseconds,  ...params } );
	}
	
	async init() {
		
		if (!this.db) {
			try {	
				this._statechange('db_initializing', 'DB init...');
				const JSDELIVR_BUNDLES = await duckdb.getJsDelivrBundles();
				const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
				console.log(bundle.mainWorker);
				const worker_url = URL.createObjectURL(
					new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
				);
						
				this.worker = new Worker(worker_url);
				this.logger = new duckdb.ConsoleLogger();
				this.db = new duckdb.AsyncDuckDB(this.logger, this.worker);
				await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
				URL.revokeObjectURL(worker_url);	
				//  end cdn init
				const duckdbversion = await this.db.getVersion();
				this._statechange('db_initialize_success', 'DB init success!',
					{
						fullversionstring: `Running DuckDB: ${duckdbversion} ${duckdb.PACKAGE_NAME} ${duckdb.PACKAGE_VERSION}`, 
						duckdbversion: duckdbversion,
						duckdbpackage: duckdb.PACKAGE_NAME,
						duckdbpackageversion: duckdb.PACKAGE_VERSION,
						dbconnected: '',
					}
				);
			} catch (e) {
				console.error(e);
				this._statechange('db_initialize_error', 'DB init failed!', e);
				//throw e;
				this.#reject(e);
			}
		} 
		
		if (this.db && !this.conn) {
			try {	
				this._statechange('db_connecting', 'DB opening...');
				await this.db.open({
						path: this.dbconnectionpath,
						accessMode: duckdb.DuckDBAccessMode.READ_WRITE
				});
				this.conn = await this.db.connect();
				const duckdbversion = await this.db.getVersion();
				this._statechange('db_connected_success', 'DB connection success!', 
						{
							fullversionstring: `Running DuckDB: ${duckdbversion} ${duckdb.PACKAGE_NAME} ${duckdb.PACKAGE_VERSION}`, 
							duckdbversion: duckdbversion,
							duckdbpackage: duckdb.PACKAGE_NAME,
							duckdbpackageversion: duckdb.PACKAGE_VERSION,
							dbconnected: this.dbconnectionpath,
						});
			} catch (e) {
				console.error(e);
				this._statechange('db_connection_open_error', 'DB connection failed!', e);
				//throw e;
				this.#reject(e);
			}
		}
		
		this.#resolve();
		return this.conn;
		
	}
	
	async getdbconn() {
		await this.#defer;
		return this.conn;
	}
	
 }

// -------------------------------------------------------------------------------------------------------
//window.duckdb = await (
async function initduckdb() {
	try {
		console.log('DB init...');

		const JSDELIVR_BUNDLES = await duckdb.getJsDelivrBundles();
		const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

		console.log(bundle.mainWorker);
		const worker_url = URL.createObjectURL(
		  new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
		);
				
		const worker = new Worker(worker_url);
		const logger = new duckdb.ConsoleLogger();
		const db = new duckdb.AsyncDuckDB(logger, worker);
		await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
		URL.revokeObjectURL(worker_url);	
		//  end cdn init
		//  https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts
		await db.open({
            path: 'opfs://testduckdb.db',
            accessMode: duckdb.DuckDBAccessMode.READ_WRITE
        });
		const conn = await db.connect();
		const duckdbversion = await db.getVersion();
		console.log('Running DuckDB: ', duckdbversion); 
		console.log('Package ', duckdb.PACKAGE_NAME, duckdb.PACKAGE_VERSION);
		const res = await conn.query(`select version() as v;`);
		console.log('Result:', res);
		console.log('Query result copy (JSON):', JSON.parse(JSON.stringify(res.toArray())));
		
		//  duckdb status  window.duckdb.duckdb.StatusCode
		//  //  https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts
		//
		//  r1 = await duckdb.conn.query("SELECT size, content, filename FROM read_blob('*');")  
		//  result:  {size: 12288n, content: Uint8Array(12288), filename: 'opfs://testduckdb.db'} 
		/*  
		 * 
		 // to copy from duckdb to parquet file in opfs: 
		 const opfsRoot = await navigator.storage.getDirectory();
		 const fileHandle = await opfsRoot.getFileHandle('test.parquet', {create: true});
		 window.duckdb.db.registerFileHandle('test.parquet', null, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true)
		 * then:
		 r1 = await duckdb.conn.query("copy (select * from t1) to 'test.parquet' (FORMAT parquet);") 
		 * JSON.stringify(r1.toArray())
		*/
		
		//  https://www.npmjs.com/package/@duckdb/duckdb-wasm
		//  https://shell.duckdb.org/docs/modules/index.html
		//console.log('Running SQL: ');    select version() as v;
		//const res = await conn.query(`SELECT count(*)::INTEGER as v FROM generate_series(0, 100) t(v)`);
		//console.log("test");

		//console.log('Result:', res);
		//console.log('Query result copy (JSON):', JSON.parse(JSON.stringify(res.toArray())));

		// -------
		
		//~ console.log('Schema init...');
		//~ const sqlres = await fetch("dbdemo3/schema.sql", { cache: "no-store" });
		//~ const sqltext = await(sqlres.text());
		//~ //console.log(sqltext);
		//~ await conn.query(sqltext.replace("dbdemo3.",""));
		
		//~ console.log('Data loading...');
		//~ /* ------------ source tables -------------------- */
		//~ //  ---------------  stroiteli
		//~ let fres = await fetch("dbdemo3/stroiteli.parquet", { cache: "no-store" });
		//~ await db.registerFileBuffer('stroiteli.parquet', new Uint8Array(await fres.arrayBuffer()));
		//~ await conn.query("INSERT INTO stroiteli SELECT * FROM read_parquet('stroiteli.parquet')");
		
		//~ // ----- periodstart, datetoday, daystoadd
		//~ await conn.query("PREPARE update_periodstart AS update monitorparams set periodstart=$1 where periodid=1;");


		//~ console.log('View init...');
		
		
		//~ let res1 = await conn.query(`SELECT * FROM monitor1;`);

		// -------
		/*
		const names = res1.schema.fields.map(f=>f.name);
		for (let i=0;i<res1.numRows;i++) {
			for (let j=0;j<names.length;j++) {
				console.log(names[j]," : ", res1.get(i)[names[j]]);							
			}
			
		}
		*/
		// -------
		//~ window.res3 = convertArrowToArray(monitor3res);
		//~ console.log('monitor3res = ',window.res3);
		
		// --------- 
		/*
		await conn.close();
		await db.terminate();
		await worker.terminate();
		*/
		
		/* -------------------------  */
		
		//~ const updateMonitor2fromdb = () => {
			//~ (async () => { 
			//~ let monitor2res = await conn.query(`SELECT * FROM monitor2;`);
			//~ if (window.duckdb) { window.duckdb.monitor2arrow = monitor2res; }
			//~ if (monitor2table) { monitor2table.setArrowRowsSource(monitor2res); }
			//~ })();
		//~ }
		/* export database
		 *   The schema.sql file contains the schema statements that are found in the database. It contains any CREATE SCHEMA, CREATE TABLE, 
		 * 		CREATE VIEW and CREATE SEQUENCE commands that are necessary to re-construct the database.

			The load.sql file contains a set of COPY statements that can be used to read the data from the CSV files again. 
			* The file contains a single COPY statement for every table found in the schema. 
		 * https://github.com/duckdb/duckdb/blob/43c5f3489858c0377d4a6e6d6e7ed8d0502ba1df/src/planner/binder/statement/bind_export.cpp#L160
		 * 
		 * checkpoint(database)
		 * await duckdb.conn.send("CHECKPOINT;");
		 * FORCE CHECKPOINT;
Description	Synchronize WAL with file for (optional) database without interrupting transactions.
* 
* 		from glob('*');
* Return filenames found at the location indicated by the search_path in a single column named file. The search_path may contain glob pattern matching syntax.
		 * 
		 * 
		 * https://duckdb.org/docs/stable/sql/meta/duckdb_table_functions.html
		 * 
		 * Note that duckdb_indexes only provides metadata about secondary indexes, i.e., those indexes created by explicit CREATE INDEX statements. Primary keys, foreign keys, and UNIQUE constraints are maintained using indexes, but their details are included in the duckdb_constraints() function.
		 *  from duckdb_schemas() where internal=false;; 
		 * CREATE SCHEMA IF NOT EXISTS s2;
		 *  from duckdb_tables();
		 *  from duckdb_views() where internal=false;
		 *  from duckdb_indexes();
		 *  from duckdb_sequences();
		 *  from duckdb_types() ?
		 *  from duckdb_functions();  ?
		 * 
		 * sqlite test
		 * let fhdb = await window.showOpenFilePicker({mode: "readwrite"});
		 *  window.duckdb.db.registerFileHandle('sakila.db', fhdb, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true)
		 * const opfsRoot = await navigator.storage.getDirectory();
			let fileHandle = await opfsRoot.getFileHandle('sakila.db', {create: true});
		    window.duckdb.db.registerFileHandle('sakila.db', fhdb, window.duckdb.duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true)
		    * 
		    let r1 = await duckdb.conn.query("select * from t1;") 
		    * JSON.stringify(r1.toArray())
		    * r1 = await duckdb.conn.query("ATTACH 'sakila.db' as db3 (TYPE sqlite);"); JSON.stringify(r1.toArray())
		    * 
let trav = async () => {
    const fh = await navigator.storage.getDirectory();
    const contents = await fh.entries();
    for await (const [key,entry] of contents) {
        //console.log(entry);
        if (entry.kind=='file') {
            const file = await entry.getFile();   //  FileSystemFileHandle
            console.log(file.name,file.size,file.lastModifiedDate,file.type);
        } else if (entry.kind=='directory') {
            console.log('dir detected');
        }
    }
}
*   python version  import sys; sys.version
*   pyodide.version
* 
* 
		*/
		
		
		/* --------------------------  */
		
		return {	
			duckdb: duckdb,
			conn: conn,
			db: db,
			worker: worker,
			logger: logger,
		};
	} catch (e) {
		console.error(e);
	}
}
//)();
