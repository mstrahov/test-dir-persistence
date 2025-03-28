//import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/+esm'; 

import { ExecTimer } from "./exectimer.js"; 
import { FileSystemHandler } from "./fileshandlers.js";
import { DuckDBLoader } from "./duckdbloader.js";
import { PyodideLoader } from "./pyodideloader.js";

console.log("test main app");


window.duckdb = new DuckDBLoader();
window.duckdb.init();

window.pyodideloader = new PyodideLoader();
window.pyodideReadyPromise = window.pyodideloader.init();
