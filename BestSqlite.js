// Ironboy 2020
// A Sqlite3 driver with no external/non-JS bindings

const fs = require('fs');
const path = require('path');
const sqlJs = require('sql.js');
const chokidar = require('chokidar');
const Store = require('./Store');
const Client = require('./Client');
const { default: fetch } = require('node-fetch');

module.exports = class BestSqlite {

  debugSave = false;
  SQL = this.constructor.SQL;
  appPath = this.constructor.appPath;
  ignoreNextReadFile = false;

  static async connect(...args) {
    if (args.length > 1 && !isNaN(+args[0])) {
      let c = new Client();
      return await c.connect(...args);
    }
    this.SQL = this.SQL || await sqlJs();
    this.appPath = Object.keys(require.cache)[0];
    return new BestSqlite(...args);
  }

  constructor(filePath) {
    // relative to absolute filepath
    if (filePath && (filePath[0] === '.' || (!filePath.includes('/') && !filePath.includes('\\')))) {
      filePath = path.join(path.dirname(this.appPath), filePath);
    }
    this.filePath = filePath;
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        // create new db
        this.db = new this.SQL.Database();
        this.saveDbToFile();
      }
      else {
        // load db from file
        this.db = new this.SQL.Database(fs.readFileSync(filePath));
      }
    }
    catch (err) { console.error(err); }
    process.on('exit', () => this.saveDbToFileReal(true, true));

    chokidar.watch(filePath).on('change', (event) => {
      if (!this.ignoreNextReadFile) {
        this.db = new this.SQL.Database(fs.readFileSync(filePath));
      }
      this.ignoreNextReadFile = false;
    });
  }

  paramPrep(obj) {
    for (let key in obj) {
      let val = obj[key];
      if (key[0] !== '$') {
        obj['$' + key] = val;
      }
    }
  }

  run(sql, params = {}) {
    sql = sql.trim();
    fs.readdirSync(__dirname);
    if (sql.toLowerCase().slice(0, 6) === 'select') {
      return this.exec(sql, params);
    }
    this.paramPrep(params);
    this.db.run(sql, params);
    let status = { rowsModified: this.db.getRowsModified() };
    sql.toLowerCase().slice(0, 6) === 'insert' && (status.lastInsertRowId = this.run('SELECT last_insert_rowid() AS a')[0].a);
    status.rowsModified && this.saveDbToFile();
    return status;
  }

  exec(sql, params = {}) {
    sql = sql.trim();
    this.paramPrep(params);
    let s = this.db.prepare(sql);
    s.bind(params);
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    return r;
  }

  registerFunction(name, func) {
    // get name from named functions if only one argument
    if (arguments.length === 1) { func = name; name = func.name }
    // register the function
    this.db.create_function(name, func);
  }

  regFunc(...args) {  // shorter alias
    this.registerFunction(...args);
  }

  saveDbToFile() {
    clearTimeout(this.dbSaveTimeout);
    this.dbSaveTimeout = setTimeout(() => this.saveDbToFileReal(), global.__bestSqliteRunningAsServer ? 1000 : 1);
  }

  saveDbToFileReal(sync = false, exit = false) {
    let data = this.db.export();
    let buffer = Buffer.from(data);
    if (sync) {
      fs.writeFileSync(this.filePath, buffer);
      this.debugSave && console.log('Saved DB to file' + (exit ? ' on exit' : ''));
    }
    else {
      fs.writeFile(this.filePath, buffer, err => {
        err && console.error(err);
        !err && this.debugSave && console.log('Saved DB to file');
      });
    }
    this.ignoreNextReadFile = true;
  }

  getTablesAndRows(type) {
    return this.run(`
      SELECT name
      FROM sqlite_master
      WHERE type = $type
      AND substr(name,0,7) != "sqlite" 
    `, { type }).map(x => x.name);
  }

  get tables() {
    return this.getTablesAndRows('table');
  }

  get views() {
    return this.getTablesAndRows('view');
  }

  sessionStore(settings = {}) {
    settings.db = this;
    return new Store(settings);
  }

}