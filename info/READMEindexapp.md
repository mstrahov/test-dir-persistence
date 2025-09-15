# adhocdb
Local-first in-browser database and Python notebook-like environment with data storage persistence. <br><br>
Runs DuckDB Wasm and Pyodide in your browser locally. Your data never leaves your browser.

## Browser support
- Latest Chromium-based browsers are supported, including mobile versions. 
- Firefox support is limited.  
- Not tested on Safari.  
- Requires JavaScript and WebAssembly to be enabled. 
- Uses FileSystem API / Origin private file system (OPFS) for local storage of projects and duckdb database. 
- Persistent OPFS storage for DuckDB database currently works only in Chromium desktop browsers. Chrome for Android and Firefox can only create an in-memory database.
- It is possible to mount external local directories only in Chromium desktop browsers, since other browsers do not support showDirectoryPicker(). Chrome Android supports showDirectoryPicker(), but currently does not mount the selected directory correctly.


## Features

- Run SQL and Python code in respective interface widgets. All features of DuckDB and Pyodide included. 
- DuckDB runs separately from Pyodide in its own thread. 
- Your data stays strictly local, adhocdb runs as a static site. 
- Persistent local storage of DuckDB database and project data in local origin private file system (OPFS).
- Mount and access a local directory for reading and writing files (desktop chromium based only browsers). Please use at your own risk. Due to functionality being dependent on third-party libraries with some experimental features, do make backups of data before allowing access for directory mounting. Click Menu -> Attach local directory... to activate.
- If persistent OPFS storage is not available for duckdb, defaults to ::memory:: database.
- Uses adjustable grid layout in the tabbed interface based on Gridstack.js and Bootstrap. Supports changing size and position of the widgets, and saving and restoring the layout of the interface. 
- Files in OPFS filesystem and mounted local directory are automatically visible to DuckDB runtime in queries like ```select * from '/app/opfs/datafile.csv';``` Proper file names with path can be copied from a "File selection" widget.
- Create and run scripts with Python and SQL code, each scripts lives in its own tab in the interface. Scripts can be saved as a local project to OPFS and opened later.
- Can import from external DuckDB export directory (Chromium-based only, directory should have the result of running ```EXPORT DATABASE``` statement.)
- Can export its DuckDB database to an external directory (Chromium-based only, can be imported to another DuckDB instance by running ```IMPORT DATABASE``` statement).
- Local database and Python scripts can be saved as .adhocdb file, and later imported to another computer/browser.
- Own import/export format of .adhocdb file is SQLite database file, it is possible to open it and access contents from any SQLite database. 
- All features of DuckDB WASM and Pyodide are supported.
- It is possible to run any supported Pyodide module, such as Pandas for data transformation, import and analysis, transfer data from Pyodide to DuckDB via an emulated in-memory filesystem, save data to external files in OPFS or mounted local directory.
- Interface for showing tables is based on [Tabulator](https://www.tabulator.info/) library. Can display large datasets with a lot of rows natively, supports filters, tree views and pagination.   
- Supports creation of interactive widgets in "script tabs", including interactive plotly.js widgets. 
- Vanilla JavaScript, hand-crafted, based on open source projects with no lock-in.

## Limitations
- Due to WebAssembly browser architecture, DuckDB and Pyodide are limited to one thread each, and 4GB of memory. More information [here](https://duckdb.org/docs/stable/clients/wasm/overview.html#limitations). 


## Motivation
- To develop a local-first notebook-like environment with a database running separately from Python runtime, and a flexible interface with powerful tables and data and interface state persistence.  
- Experiment in UI/UX for interacting with the database and building interactive widgets and dashboards, running without having to install any additional software.  


## Setup locally
Clone and run a local webserver from a directory where you cloned the project.
<br>
If using Python, run: ```python3 -m http.server```, then open: ```http://localhost:8000/``` in your browser.


### AdhocDB would not be possible without these awesome opensource projects:

- [Pyodide](https://pyodide.org/en/stable/) ([source](https://github.com/pyodide/pyodide))
- [DuckDB](https://duckdb.org/) ([source](https://github.com/duckdb/duckdb-wasm))
- [Tabulator](https://www.tabulator.info/) ([source](https://github.com/olifolkerd/tabulator))
- [Codemirror](https://codemirror.net/5/) ([source](https://github.com/codemirror/codemirror5))
- [Bootstrap](https://getbootstrap.com/)
- [Tabler.io](https://tabler.io/docs/ui)
- [Plotly.py](https://github.com/plotly/plotly.py)
- [Plotly.js](https://github.com/plotly/plotly.js)
- [Gridstack.js](https://gridstackjs.com/)