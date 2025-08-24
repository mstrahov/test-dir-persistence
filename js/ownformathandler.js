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
  #duckdbloader;
  #defer;
  #resolve;
  #reject;
  #deferexpimp;
  #resolveexpimp;
  #rejectexpimp;

  constructor(params) {
    this.#defer = new Promise((res, rej) => {
      this.#resolve = res;
      this.#reject = rej;
    });

    this.FORMAT_VERSION = "0.1";
    this.eventbus = new EventBus();
    this.#pyodidePromise = params.pyodidePromise;
    this.#pyodide = undefined;
    this.#dbfilename = params.dbFileName;
    this.#iohandler = params.FileIOHandler;
    this.#duckdbloader = params.duckdbloader;
    this.namespaceuuid = params.namespaceuuid;
    this.coderunner = params.coderunner;
    this.scriptsarr = [];
    this.iostate = "";
  }

  // ------------------------------------------------------------------------------------------------------------------------
  get dbfilename() {
    return this.#dbfilename;
  }

  // -----------------------------------------------------------------------------------------------------
  _statechange(newstate, addmessage = "", params = {}) {
    this.iostate = newstate;

    if (params?.error) {
      console.error(addmessage, params);
    } else {
      console.log(newstate, addmessage, params);
    }

    this.eventbus.dispatch("statechange", this, {
      state: newstate,
      message: addmessage,
      lengthmilli: params?.lengthmilli || 0,
      lengthseconds: params?.lengthseconds || 0,
      ...params,
    });
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
      let output = await this.coderunner.runPythonAsync(
        `
import pyodide_js
await pyodide_js.loadPackage('micropip')
import micropip
await micropip.install('sqlite3')
import sqlite3
`,
        this.namespaceuuid,
      );
    } catch (err) {
      console.error("Error initializing sqlite3", err);
    }
    //window.exectimer.timeit("done!");
    this.#resolve();
  }

  // -----------------------------------------------------------------------------------------------------
  async openConn(ownfilename = "") {
    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();

    await this.#defer;
    this.#defer = new Promise((res, rej) => {
      this.#resolve = res;
      this.#reject = rej;
    });
    let curdbfilename = ownfilename ? ownfilename : this.#dbfilename;
    const cmd = `
conn_internal = sqlite3.connect("${curdbfilename}")
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

    try {
      //~ let output = await this.#pyodide.runPythonAsync(cmd);

      let output = await this.coderunner.runPythonAsync(
        cmd,
        this.namespaceuuid,
      );
    } catch (err) {
      console.error(
        "Error opening internal file connection",
        curdbfilename,
        err,
      );
      this.#resolve();
    }
  }

  // -----------------------------------------------------------------------------------------------------
  async closeConn(supressSyncFS = false) {
    const cmd = `
conn_internal.commit()
conn_internal.close()
`;
    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();
    try {
      //~ let output = await this.#pyodide.runPythonAsync(cmd);
      let output = await this.coderunner.runPythonAsync(
        cmd,
        this.namespaceuuid,
      );
    } catch (err) {
      console.error("Error closing internal file connection", err);
    }

    if (!supressSyncFS) {
      await this.#iohandler.syncFS();
    }
    this.#resolve();
  }

  // -----------------------------------------------------------------------------------------------------
  async syncFS() {
    await this.#iohandler.syncFS();
  }
  // -----------------------------------------------------------------------------------------------------

  async writeObjectFromString(name, objuuid, objtype, stringval) {
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
    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();

    const encoder = new TextEncoder();
    self.globalThis.filedata_01 = encoder.encode(stringval);
    await this.openConn();
    try {
      //~ let output = await this.#pyodide.runPythonAsync(cmd);
      let output = await this.coderunner.runPythonAsync(
        cmd,
        this.namespaceuuid,
      );
    } catch (err) {
      console.error(
        "Error writing object from string value to project file ",
        name,
        objuuid,
        objtype,
        err,
      );
    }
    await this.closeConn();
    //window.exectimer.timeit("done!");
  }

  // -----------------------------------------------------------------------------------------------------
  async writeObjectFromFile(
    name,
    objuuid,
    objtype,
    filename,
    ownfilename = "",
    supressSyncFS = false,
  ) {
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
    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();

    if (!(await this.#iohandler.pathExists(filename))) {
      console.error("File does not exist: ", filename);
      return;
    }

    await this.openConn(ownfilename);
    try {
      //~ let output = await this.#pyodide.runPythonAsync(cmd);
      let output = await this.coderunner.runPythonAsync(
        cmd,
        this.namespaceuuid,
      );
    } catch (err) {
      console.error(
        "Error writing object from file to project file ",
        name,
        objuuid,
        objtype,
        err,
      );
    }
    await this.closeConn(supressSyncFS);
    //window.exectimer.timeit("done!");
  }

  // -----------------------------------------------------------------------------------------------------

  async readObjectToString(objuuid, objtype, ownfilename = "", supressSyncFS = true) {
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
    await this.openConn(ownfilename);
    try {
      //~ output = await this.#pyodide.runPythonAsync(cmd);
      let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
      if (res.runStatus) {
        output = res.output;
      } else {
        console.error(
          "Error reading object from file to project file ",
          objuuid,
          objtype,
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to read object from file to project file",
        objuuid,
        objtype,
        err,
      );
    }
    await this.closeConn(supressSyncFS);
    //window.exectimer.timeit("done!");
    return output;
  }

  // -----------------------------------------------------------------------------------------------------

  async readObjectToFile(objuuid, objtype, filename, ownfilename = "", supressSyncFS = true) {
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
    await this.openConn(ownfilename);
    try {
      //~ output = await this.#pyodide.runPythonAsync(cmd);
      let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
      if (res.runStatus) {
        output = res.output;
      } else {
        console.error(
          "Error reading object from file to project file",
          objuuid,
          objtype,
          filename,
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to read object from file to project file",
        objuuid,
        objtype,
        filename,
        err,
      );
    }
    await this.closeConn(supressSyncFS);
    //window.exectimer.timeit("done!");
    return output;
  }

  // -----------------------------------------------------------------------------------------------------

  async getObjTypeStats(ownfilename = "", supressSyncFS = true) {
    const cmd = `
conn_internal_data = conn_internal.execute('''
	SELECT objtype, count(objuuid) as objcount
    FROM tbl_objects group by objtype order by objtype;
''').fetchall()
conn_internal_data
`;
    let output = undefined;
    await this.openConn(ownfilename);
    try {
      let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
      if (res.runStatus) {
        output = res.output.toJs();
      } else {
        console.error(
          "Error reading object types from file to project file",
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to read object types from file to project file",
        err,
      );
    }
    await this.closeConn(supressSyncFS);
    return output;
  }

  // -----------------------------------------------------------------------------------------------------

  async getAllObjectsOfType(objtype, ownfilename = "", supressSyncFS = true) {
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
	SELECT name, objuuid, data, objtype, datahash, modtimestamp FROM tbl_objects
    WHERE objtype='${objtype}';
''').fetchall()
conn_internal_data
`;
    let output = undefined;
    await this.openConn(ownfilename);
    try {
      let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
      if (res.runStatus) {
        //output = res.output.toJs();
        // ****
        const resoutput = res.output.toJs();
        output = [];
		for (let i=0;i<resoutput.length;i++) {
			output.push({
				name: resoutput[i][0],
				objuuid: resoutput[i][1],
				data: resoutput[i][2],
				objtype: resoutput[i][3],
				datahash: resoutput[i][4],
				modtimestamp: resoutput[i][5],
			});
        }
        // ****
      } else {
        console.error(
          "Error reading object types from file to project file",
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to read object types from file to project file",
        err,
      );
    }
    await this.closeConn(supressSyncFS);
    return output;
  }
// -----------------------------------------------------------------------------------------------------

  async getAllObjectsOfTypeMetaData(objtype, ownfilename = "", supressSyncFS = true) {
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
	SELECT name, objuuid, objtype, datahash, modtimestamp FROM tbl_objects
    WHERE objtype='${objtype}';
''').fetchall()
conn_internal_data
`;
    let output = undefined;
    await this.openConn(ownfilename);
    try {
      let res = await this.coderunner.runPythonAsync(cmd, this.namespaceuuid);
      if (res.runStatus) {
        const resoutput = res.output.toJs();
        output = [];
		for (let i=0;i<resoutput.length;i++) {
			output.push({
				name: resoutput[i][0],
				objuuid: resoutput[i][1],
				objtype: resoutput[i][2],
				datahash: resoutput[i][3],
				modtimestamp: resoutput[i][4],
			});
			
		}
      } else {
        console.error(
          "Error reading object types from file to project file",
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to read object types from file to project file",
        err,
      );
    }
    await this.closeConn(supressSyncFS);
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
        console.error(
          "Error deleting object",
          this.#dbfilename,
          objuuid,
          objtype,
          res.error,
        );
      }
    } catch (err) {
      console.error(
        "Failed to delete object ",
        this.#dbfilename,
        objuuid,
        objtype,
        err,
      );
    }
    await this.closeConn();
    return output;
  }

  // -----------------------------------------------------------------------------------------------------

  async deleteScript(objuuid) {
    const ind1 = this.scriptsarr.findIndex((v) => v.objuuid === objuuid);
    if (ind1 > -1) {
      await this.deleteObjectByUuid(objuuid, "script");
      this.scriptsarr.splice(ind1, 1);
    }
  }

  // -----------------------------------------------------------------------------------------------------

  async getScriptsArrayFromOwnFormatFile(ownfilename = "", supressSyncFS = true) {
    let res = [];

    let scriptlist = await this.getAllObjectsOfType("script", ownfilename, supressSyncFS);
    if (!scriptlist) {
      console.error("Script list is not received from file!");
      return res;
    }
    for (let i = 0; i < scriptlist.length; i++) {
      try {
        let scriptobj = JSON.parse(new TextDecoder().decode(scriptlist[i].data));
        res.push(scriptobj);
      } catch (err) {
        console.error("Script parsing from json error:", scriptlist[i], err);
      }
    }

    return res;
  }

  // -----------------------------------------------------------------------------------------------------

  generateTabulatorTree() {
    let resTree = [];
    if (!this.scriptsarr || this.scriptsarr.length === 0) {
      return resTree;
    }
    // nodeObj['_children']
    let scripttree = [];

    for (let i = 0; i < this.scriptsarr.length; i++) {
      scripttree.push({
        name: this.scriptsarr[i].name,
        isopen: this.scriptsarr[i].isopen,
        autorun: this.scriptsarr[i].autorun,
        runorder: this.scriptsarr[i].runorder,
        objtype: this.scriptsarr[i].objtype,
        objuuid: this.scriptsarr[i].objuuid,
        //visualwidgetsnum: this.scriptsarr[i].visualwidgets?.length,
        //gridwidgetsnum: this.scriptsarr[i].gridwidgets?.length,
        //scriptlength: this.scriptsarr[i].scriptObject?.transformSteps?.length,
        lastRunResult: this.scriptsarr[i].scriptObject?.lastRunResult,
        lastRunStatus: this.scriptsarr[i].scriptObject?.lastRunStatus,
        _level: 1,
      });
    }

    resTree.push({
      name: "Scripts",
      isopen: null,
      autorun: null,
      runorder: null,
      objtype: "",
      objuuid: "",
      //visualwidgetsnum: this.scriptsarr[i].visualwidgets?.length,
      //gridwidgetsnum: this.scriptsarr[i].gridwidgets?.length,
      //scriptlength: this.scriptsarr[i].scriptObject?.transformSteps?.length,
      lastRunResult: "",
      lastRunStatus: null,
      _children: scripttree,
      _level: 0,
    });

    return resTree;
  }

  // -----------------------------------------------------------------------------------------------------
  updateScriptArrayData(eventdata) {
    // {fieldname: cell.getField(), oldvalue: cell.getOldValue(), newvalue:cell.getValue(), rowdata: cell.getData(), });
    const ind = this.scriptsarr.findIndex(
      (val) => val.objuuid === eventdata.rowdata.objuuid,
    );
    if (ind > -1) {
      if (eventdata.fieldname === "runorder") {
        this.scriptsarr[ind][eventdata.fieldname] = parseInt(
          eventdata.newvalue,
        );
      } else if (eventdata.fieldname === "name") {
        this.scriptsarr[ind][eventdata.fieldname] = eventdata.newvalue.trim();
        this.scriptsarr[ind]["scriptname"] = eventdata.newvalue.trim();
        this.scriptsarr[ind]["tabtitle"] = eventdata.newvalue.trim();
      } else {
        this.scriptsarr[ind][eventdata.fieldname] = eventdata.newvalue;
      }
    }
  }
  // -----------------------------------------------------------------------------------------------------

  async saveScriptData(scriptobj, isopenvalue = null) {
    let scriptownformat = scriptobj.toOwnFormat();
    const ind = this.scriptsarr.findIndex(
      (val) => val.objuuid === scriptownformat.objuuid,
    );
    let scriptjson = "";

    if (ind > -1) {
      let savedproperties = ["isopen", "autorun", "runorder"];
      savedproperties.forEach(
        (v) => (scriptownformat[v] = this.scriptsarr[ind][v]),
      );
      if (isopenvalue !== null) {
        scriptownformat.isopen = isopenvalue;
      }
      scriptjson = JSON.stringify(scriptownformat);
      this.scriptsarr[ind] = JSON.parse(scriptjson);
    } else {
      scriptownformat.isopen = isopenvalue !== null ? isopenvalue : true;
      scriptownformat.autorun = true;
      scriptownformat.runorder = (this.scriptsarr.length + 1) * 10;
      scriptjson = JSON.stringify(scriptownformat);
      this.scriptsarr.push(JSON.parse(scriptjson));
    }
    console.log("script saved: ", scriptownformat);
    await this.writeObjectFromString(
      scriptownformat.name,
      scriptownformat.objuuid,
      scriptownformat.objtype,
      scriptjson,
    );
  }

  // -------------------------------------------------------------------------------------------------------

  async saveScriptByUuid(objuuid, isopenvalue = null) {
    const ind = this.scriptsarr.findIndex((val) => val.objuuid === objuuid);
    if (ind > -1) {
      await this.writeObjectFromString(
        this.scriptsarr[ind].name,
        this.scriptsarr[ind].objuuid,
        this.scriptsarr[ind].objtype,
        JSON.stringify(this.scriptsarr[ind]),
      );
    }
  }
  // -------------------------------------------------------------------------------------------------------

  async exportDuckDbToDirPath(dirPath) {
    let containerDirHandle =
      await this.#iohandler.findOrCreateDirectoryHandleByFilePath(dirPath);
    await this.exportDuckDbToDir(containerDirHandle);
  }

  // -------------------------------------------------------------------------------------------------------

  async exportDuckDbToDir(containerDirHandle) {
    //~ EXPORT DATABASE 'exportdb' (FORMAT parquet, COMPRESSION zstd);
    //~ SELECT * FROM glob("*");
    //~ const buffer = await window.duckdb.db.copyFileToBuffer('exportdb/tbl_df.parquet');   // Uint8Array
    //~ await window.duckdb.db.dropFile('exportdb/tbl_df.parquet');   // const buffer = await this.#duckdbloader.db.copyFileToBuffer(this.duckdbfilehandles[ind].filename);
    //~ let pyodide = await window.pyodideReadyPromise;
    //~ await pyodide.FS.writeFile('/app/tbl_df.parquet',buffer)

    const EXPORT_DIR_NAME = "exportdb";
    if (!containerDirHandle) {
      return false;
    }

    const starttime = performance.now();
    this._statechange(
      "ownformatoperation_start",
      `Starting database export to directory: ${containerDirHandle.name}/${EXPORT_DIR_NAME}`,
    );

    try {
      if (containerDirHandle.kind !== "directory") {
        this._statechange(
          "ownformatoperation_error",
          `${containerDirHandle.name} must be a directory. Cannot export database!`,
        );
        return false;
      }

      const permission = await containerDirHandle.queryPermission({
        mode: "readwrite",
      });
      if (permission !== "granted") {
        this._statechange(
          "ownformatoperation_error",
          `Write permission is not granted for directory ${containerDirHandle.name}. Cannot export database!`,
        );
        return false;
      }
    } catch (e) {
      this._statechange(
        "ownformatoperation_error",
        `Error checking permission on directory: ${containerDirHandle.name}. Cannot write to a directory!`,
      );
      return false;
    }

    let exportDir;
    try {
      exportDir = await containerDirHandle.getDirectoryHandle(EXPORT_DIR_NAME, {
        create: true,
      });
    } catch (e) {
      this._statechange(
        "ownformatoperation_error",
        `Error exporting database to: ${containerDirHandle.name}/${EXPORT_DIR_NAME}. Cannot create a directory!`,
        { error: e },
      );
      return false;
    }

    try {
      if (!(await (await exportDir.entries()).next()).done) {
        this._statechange(
          "ownformatoperation_error",
          `Error exporting database to: ${containerDirHandle.name}/${EXPORT_DIR_NAME}. Directory must be empty!`,
        );
        return false;
      }
    } catch (e) {
      this._statechange(
        "ownformatoperation_error",
        `Error exporting database, cannot open directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} !`,
        { error: e },
      );
      return false;
    }

    await this.#iohandler.FileIOinitialized();
    let duckdbloader = await this.#iohandler.getduckdbloader();

    try {
      await this.coderunner.runSQLAsync(`CHECKPOINT;`);
      await this.coderunner.runSQLAsync(
        `EXPORT DATABASE '${EXPORT_DIR_NAME}' (FORMAT parquet, COMPRESSION zstd);`,
      );
      let qryres = await this.coderunner.runSQLAsync(
        `SELECT "file" FROM glob("${EXPORT_DIR_NAME}/*");`,
      );

      if (qryres?.runResult) {
        this._statechange(
          "ownformatoperation_message",
          `Database exported to memory, total files: ${qryres?.output?.numRows}`,
        );
        for (let i = 0; i < qryres?.output?.numRows; i++) {
          const filename = qryres?.output?.get(i)["file"]?.toString();
          const filenameShort = filename.replaceAll(`${EXPORT_DIR_NAME}/`, "");
          this._statechange(
            "ownformatoperation_message",
            `Database export, processing file: ${filename}`,
          );
          const buffer = await duckdbloader.db.copyFileToBuffer(filename);

          const fileHandle = await exportDir.getFileHandle(filenameShort, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(buffer);
          await writable.close();

          await duckdbloader.db.dropFile(filename);
        }
      }
    } catch (e) {
      this._statechange(
        "ownformatoperation_error",
        `Error exporting database, cannot open directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} !`,
        { error: e },
      );
      return false;
    }

    let lengthmilli = performance.now() - starttime;
    let lengthseconds = lengthmilli / 1000;
    // let executionTime = Math.round(res.lengthmilli)/1000;
    this._statechange(
      "ownformatoperation_success",
      `Export to directory ${containerDirHandle.name}/${EXPORT_DIR_NAME} complete.`,
      {
        lengthmilli: lengthmilli,
        lengthseconds: lengthseconds / 1000,
      },
    );

    return true;
  }

  // -------------------------------------------------------------------------------------------------------

  async importDuckDbFromDirPath(dirPath) {
    let containerDirHandle =
      await this.#iohandler.findOrCreateDirectoryHandleByFilePath(dirPath);

    if (!containerDirHandle) {
      this._statechange(
		"ownformatoperation_error",
		`Error importing database, cannot open directory ${dirPath} !`,
		{},
      );
      return false;
    }

    await this.importDuckDBFromDir(containerDirHandle);
  }

  // -------------------------------------------------------------------------------------------------------
  async importDuckDBFromDir(containerDirHandle) {
    // container dir handle must be duckdb export directory
    // await sd01.queryPermission({mode: 'read'})
    // const fileName = file.name;
    // const fileData = new Uint8Array(await file.arrayBuffer());

    //~ if (containerDirHandle.kind!=='directory') {
    //~ this._statechange('db_export_to_dir_error', `${containerDirHandle.name} must be a directory. Cannot export database!`);
    //~ return false;
    //~ }
    if (!containerDirHandle) {
      return false;
    }
    // load.sql
    // schema.sql
    // **************
    let dirsize = 0;
    let nesteddircount = 0;
    let loadsqlpresent = false;
    let schemasqlpresent = false;
    let filecount = 0;
    let contents;
    try {
      contents = await containerDirHandle.entries();
    } catch (err) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: Cannot open import directory !`,
        { error: err },
      );
      return false;
    }
    for await (const [key, entry] of contents) {
      //console.log(entry);
      filecount++;
      if (entry.kind == "file") {
        const file = await entry.getFile(); //  FileSystemFileHandle
        dirsize += file.size;
        //console.log(file.name,file.size,file.lastModifiedDate,file.type);
        if (file.name === "load.sql") {
          loadsqlpresent = true;
        }
        if (file.name === "schema.sql") {
          schemasqlpresent = true;
        }
      } else if (entry.kind == "directory") {
        nesteddircount++;
      }
    }
    if (!schemasqlpresent) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: schema.sql is not present, not created by EXPORT DATABASE?`,
        {},
      );
      return false;
    }
    // check for dir size?
    // **************

    // detach db

    const conntype = this.#duckdbloader.dbconnectiontype; //  ==='opfs'
    let connpath = this.#duckdbloader.dbconnectionpath; // 'opfs://mainapp.db';
    connpath = connpath.replaceAll("opfs://", "/app/opfs/");

    let connclosed = await this.#duckdbloader.closeDBConn();
    if (!connclosed) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: cannot close existing database connection !`,
        {},
      );
      return false;
    }

    // backup db file
    if (conntype === "opfs") {
      let res;

      //~ const newconn = await this.#duckdbloader.reopenDBconn('opfs://mainapp01.db');
      //~ if (!newconn) {
      //~ this._statechange('ownformatoperation_error', `Import database error: new :memory: database connection init error !`, { });
      //~ return false;
      //~ }

      //~ try {
      //~ await this.#duckdbloader.db.dropFile(connpath);
      //~ await this.#duckdbloader.db.dropFile(connpath+'.wal');
      //~ } catch (err) {
      //~ this._statechange('ownformatoperation_error', `Import database error: cannot free memory buffer for ${connpath} !`, { error: err });
      //~ }

      res = await this.#iohandler.backupExistingFileInPlace(connpath);
      if (!res) {
        this._statechange(
          "ownformatoperation_error",
          `Import database error: unable to backup existing database !`,
          {},
        );
        return false;
      }

      res = await this.#iohandler.deleteFileFromFSandFileHandle(connpath);
      if (!res) {
        this._statechange(
          "ownformatoperation_error",
          `Import database error: unable to delete existing database file !`,
          {},
        );
        return false;
      }
      res = await this.#iohandler.deleteFileFromFSandFileHandle(
        connpath + ".wal",
      );

      //~ connclosed = await this.#duckdbloader.closeDBConn();
      //~ if (!connclosed) {
      //~ this._statechange('ownformatoperation_error', `Import database error: cannot close existing :memory: database connection !`, { });
      //~ return false;
      //~ }
    }
    // init new db

    const newconn = await this.#duckdbloader.reopenDBconn();
    if (!newconn) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: new database connection init error !`,
        {},
      );
      return false;
    }

    // copy all files to duckdb memory
    let filelist = [];
    const exportdirname = "exportdb";
    try {
      contents = await containerDirHandle.entries();
    } catch (err) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: Cannot open import directory !`,
        { error: err },
      );
      return false;
    }

    for await (const [key, entry] of contents) {
      if (entry.kind == "file") {
        const fullfilename = exportdirname + "/" + entry.name;
        filelist.push(fullfilename);
        //~ await window.duckdb.db.registerFileBuffer('exportdb/tbl_df.parquet', buffer2);
        //~ await db.registerFileHandle('local.parquet', pickedFile, DuckDBDataProtocol.BROWSER_FILEREADER, true);
        //~ await db.registerFileBuffer('buffer.parquet', new Uint8Array(await res.arrayBuffer()));
        try {
          let fl = await entry.getFile();
          let b1 = await fl.arrayBuffer();
          let b2 = new Uint8Array(b1);
          await window.duckdb.db.registerFileBuffer(fullfilename, b2);
        } catch (err) {
          this._statechange(
            "ownformatoperation_error",
            `Import database error: cannot read file ${entry.name} !`,
            { error: err },
          );
          return false;
        }
      }
    }

    // import database

    let res = await this.coderunner.runSQLAsync(`IMPORT DATABASE 'exportdb';`);
    if (!res.runStatus) {
      this._statechange(
        "ownformatoperation_error",
        `Import database error: IMPORT DATABASE command error !`,
        {},
      );
      return false;
    }
    res = await this.coderunner.runSQLAsync(`CHECKPOINT;`);

    // delete temp files from duckdb memory
    for (let i = 0; i < filelist.length; i++) {
      try {
        await this.#duckdbloader.db.dropFile(filelist[i]);
      } catch (err) {
        this._statechange(
          "ownformatoperation_error",
          `Import database error: cannot free temporary memory buffer for ${filelist[i]} !`,
          { error: err },
        );
      }
    }
    return true;
  }
  // -------------------------------------------------------------------------------------------------------

  async exportDuckDbToOwnFormat() {
    // save scripts to own format first (assume current project state is saved

    // copy .adhocdb file to a temp location
    const TEMP_EXPORT_OWNFILE_PATH = "/app/temp/default_export.adhocdb";
    const EXPORT_TEMP_FILE_PATH = "/app/temp/export.temp";
    const EXPORT_DIR_NAME = "exportdb";
    let res;

    const starttime = performance.now();
    this._statechange("ownformatoperation_start", `Starting project export...`);

    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();

    await this.#deferexpimp;
    this.#deferexpimp = new Promise((res, rej) => {
      this.#resolveexpimp = res;
      this.#rejectexpimp = rej;
    });

    await this.#defer;
    this.#defer = new Promise((res, rej) => {
      this.#resolve = res;
      this.#reject = rej;
    });

    try {
      let ownfilecontents = this.#pyodide.FS.readFile(this.#dbfilename);
      this.#pyodide.FS.writeFile(TEMP_EXPORT_OWNFILE_PATH, ownfilecontents);
    } catch (err) {
      this._statechange(
        "ownformatoperation_error",
        `Export project file error: Cannot copy ${this.#dbfilename} !`,
        { error: err },
      );
      this.#resolve();
      this.#resolveexpimp();
      return false;
    }

    // release own file after copy
    this.#resolve();

    // export db
    this._statechange(
      "ownformatoperation_message",
      `Starting database export...`,
    );

    try {
      res = await this.coderunner.runSQLAsync(`CHECKPOINT;`);
      if (!res.runStatus) {
        this._statechange(
          "ownformatoperation_error",
          `Export database error: CHECKPOINT command error !`,
          {},
        );
        this.#resolveexpimp();
        return false;
      }
      res = await this.coderunner.runSQLAsync(
        `EXPORT DATABASE '${EXPORT_DIR_NAME}' (FORMAT parquet, COMPRESSION zstd);`,
      );
      if (!res.runStatus) {
        this._statechange(
          "ownformatoperation_error",
          `Export database error: EXPORT DATABASE sql command error !`,
          {},
        );
        this.#resolveexpimp();
        return false;
      }

      let qryres = await this.coderunner.runSQLAsync(
        `SELECT "file" FROM glob("${EXPORT_DIR_NAME}/*");`,
      );

      if (qryres?.runResult) {
        this._statechange(
          "ownformatoperation_message",
          `Database exported to memory, total files: ${qryres?.output?.numRows}`,
        );
        for (let i = 0; i < qryres?.output?.numRows; i++) {
          // save each exportdb object to a temp file, then to a temp .adhocdb record
          const filename = qryres?.output?.get(i)["file"]?.toString();
          const filenameShort = filename.replaceAll(`${EXPORT_DIR_NAME}/`, "");
          this._statechange(
            "ownformatoperation_message",
            `Database export, processing file: ${filename}`,
          );
          const buffer = await this.#duckdbloader.db.copyFileToBuffer(filename);
          await this.#pyodide.FS.writeFile(EXPORT_TEMP_FILE_PATH, buffer);
          const objuuid = self.crypto.randomUUID();
          await this.writeObjectFromFile(
            filenameShort,
            objuuid,
            "exportdb",
            EXPORT_TEMP_FILE_PATH,
            TEMP_EXPORT_OWNFILE_PATH,
            true,
          );
          await this.#duckdbloader.db.dropFile(filename);
        }
      } else {
        this._statechange(
          "ownformatoperation_error",
          `Export database error: nothing exported !`,
          {},
        );
        this.#resolveexpimp();
        return false;
      }
    } catch (err) {
      this._statechange(
        "ownformatoperation_error",
        `Error exporting database!`,
        { error: err },
      );
      this.#resolveexpimp();
      return false;
    }

    // save as temp .adhocdb

    // ******
    let lengthmilli = performance.now() - starttime;
    let lengthseconds = lengthmilli / 1000;
    this._statechange("ownformatoperation_success", `Export complete!`, {
      lengthmilli: lengthmilli,
      lengthseconds: lengthseconds / 1000,
    });

    this.#resolveexpimp();
    return TEMP_EXPORT_OWNFILE_PATH;
  }

  // -------------------------------------------------------------------------------------------------------

  async importDuckDbFromOwnFormat(importfilepath) {
    let res;
	let errormessage = null;

    const IMPORT_DB_TEMP_DIR = "/app/opfs/tempimport";
    
	
	
    const starttime = performance.now();
    this._statechange(
      "ownformatoperation_start",
      `Starting project import from file...`,
    );

    if (!this.#pyodide) {
      await this.init();
    }
    await this.#iohandler.FileIOinitialized();

    await this.#deferexpimp;
    this.#deferexpimp = new Promise((res, rej) => {
      this.#resolveexpimp = res;
      this.#rejectexpimp = rej;
    });

    // check that file importfilepath exists ****************************************************************************************************************
    if (!(await this.#iohandler.pathExists(importfilepath))) {
      this._statechange(
        "ownformatoperation_error",
        `Import project file error: file not found ${importfilepath} !`,
        { error: null },
      );
      this.#resolveexpimp();
      return false;
    }

    // check that format version string is present in the new file, and at least one of scripts/database objects is present ****************************
    
    const typeStats = await this.getObjTypeStats(importfilepath);
	console.log("file contents: ", typeStats);
	
	let fileProperties = {
		formatVersionCount: 0,
		exportDBCount: 0,
		scriptCount:0,
		ownFormatVersionString:'',
		dbObjectsList: [],
		schemaIndex: -1,
		
	};
	if (typeStats && Array.isArray(typeStats)) {
		for (let i=0;i<typeStats.length;i++) {
			if (typeStats[i] && Array.isArray(typeStats[i]) && typeStats[i].length>1) {
				if (typeStats[i][0]==="format_version") { fileProperties.formatVersionCount = typeStats[i][1] } 
				else if (typeStats[i][0]==="exportdb") { fileProperties.exportDBCount = typeStats[i][1] } 
				else if (typeStats[i][0]==="script") { fileProperties.scriptCount = typeStats[i][1] } 
			}
		}
	}
	console.log("FOUND VERSION STRINGS ", fileProperties.formatVersionCount, " properties: ",fileProperties);
	// errormessage
	if (fileProperties.formatVersionCount!==1) {
		errormessage = "File is not a adhocdb file. Wrong format or format_version missing.";
	}
	if (fileProperties.exportdb===0&&fileProperties.script===0) {
		errormessage = "File is empty. No database or script objects found, nothing to import.";
	}
	
	if (errormessage) {
		this._statechange(
			"ownformatoperation_error",
			errormessage,
			{ error: null },
		);
		this.#resolveexpimp();
		return false;
	}

	// check import file format number ****************************************************************************************
	
	fileProperties.ownFormatVersionString = await this.readObjectToString("format_version", "format_version", importfilepath);
	console.log("File version: ", fileProperties.ownFormatVersionString);
	
	if (!fileProperties.ownFormatVersionString) {
		errormessage = "Import file format version is not provided or incompatible.";
		this._statechange(
			"ownformatoperation_error",
			errormessage,
			{ error: null },
		);
		this.#resolveexpimp();
		return false;
		
	}
	
    // get all exportdb files and check that schema.sql object is present in the new file ********************************************************
	if (fileProperties.exportDBCount>0) {
		fileProperties.dbObjectsList = await this.getAllObjectsOfTypeMetaData("exportdb",importfilepath);
		console.log("DB Objects:",fileProperties.dbObjectsList);
		
		fileProperties.schemaIndex = fileProperties.dbObjectsList.findIndex(v=>v.name==='schema.sql');
		console.log("SCHEMA INDEX = ", fileProperties.schemaIndex);
		if (fileProperties.schemaIndex===-1) {
			errormessage = "Import file does not contain schema.sql!";
			this._statechange(
				"ownformatoperation_error",
				errormessage,
				{ error: null },
			);
			this.#resolveexpimp();
			return false;
			
		}
				
	}
	

    // backup current /app/opfs/default.adhocdb file ---------------------------------------------------
    await this.#defer;
    this.#defer = new Promise((res, rej) => {
      this.#resolve = res;
      this.#reject = rej;
    });

    try {
		const res = await this.#iohandler.backupExistingFileInPlace(this.#dbfilename);
		if (!res) {
			errormessage = `Cannot backup ${this.#dbfilename}, aborting import!`;
			this._statechange(
				"ownformatoperation_error",
				errormessage,
				{ error: null },
			);
			this.#resolve();
			this.#resolveexpimp();
			return false;
		}
    } catch (err) {
		errormessage = `Error during ${this.#dbfilename} backup, aborting import!`;
		this._statechange(
			"ownformatoperation_error",
			errormessage,
			{ error: null },
		);
		this.#resolve();
		this.#resolveexpimp();
		return false;
    }

    // release own file after backup copy
    
     // delete project file from opfs (?)

    res = await this.#iohandler.deleteFileFromFSandFileHandle(this.#dbfilename);
    this.#resolve();
    
    await this.writeObjectFromString("format_version", "format_version", "format_version", this.FORMAT_VERSION );

    // ************************************

    // copy exportdb objects from temp imported file to duckdb if fileProperties.exportDBCount>0 and import database
	if (fileProperties.exportDBCount>0) {
		//  IMPORT_DB_TEMP_DIR
		let containerDirHandle = await this.#iohandler.findOrCreateDirectoryHandleByFilePath(IMPORT_DB_TEMP_DIR);
		await this.#iohandler.syncFS();
		let existingfiles = await this.#iohandler.genFileTreePyFS(IMPORT_DB_TEMP_DIR); 
		for (let i=0;i<existingfiles.length;i++) {
			if (existingfiles[i].type==='file') {
				res = await this.#iohandler.deleteFileFromFSandFileHandle(existingfiles[i].fullpath);	
			}
		}
		
		for (let i=0;i<fileProperties.dbObjectsList.length;i++) {
			res = await this.readObjectToFile(fileProperties.dbObjectsList[i].objuuid, fileProperties.dbObjectsList[i].objtype, 
												IMPORT_DB_TEMP_DIR+"/"+fileProperties.dbObjectsList[i].name, importfilepath, false); 			
		}
		
		res = await this.importDuckDBFromDir(containerDirHandle);
		
	}

   
    
    // copy all script objects from imported file to project file ?  or just copy the whole thing? if fileProperties.scriptCount>0
    if (fileProperties.scriptCount>0) {
		// get a list of scripts
		// this.#dbfilename
		this.scriptsarr = await this.getScriptsArrayFromOwnFormatFile(importfilepath);
		console.log('Imported scripts: ', this.scriptsarr);
		this.scriptsarr.sort((a, b)=>a.runorder-b.runorder);
		
		// save scripts to default.adhocdb
		for (let i=0;i<this.scriptsarr.length;i++) {
			res = await window.localFormatSaver.saveScriptByUuid(this.scriptsarr[i].objuuid);
		}
	}
    
    // #close all open script windows 

    // #load local project file to open all scripts

    // ************************************
    let lengthmilli = performance.now() - starttime;
    let lengthseconds = lengthmilli / 1000;
    this._statechange("ownformatoperation_success", `File import complete!`, {
      lengthmilli: lengthmilli,
      lengthseconds: lengthseconds / 1000,
    });

    this.#resolveexpimp();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------
} // end of class OwnFormatHandler
