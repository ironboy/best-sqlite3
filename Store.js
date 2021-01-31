// Ironboy 2020
// An express-session store plugin
// for the best-sqlite3 database driver

// The express session documentation says that a store should
// extend Node EventEmitter, but actually it shold extend their
// basic Store class!
let esStore = Object;
try {
  esStore = require("express-session").Store;
}
catch (e) { }

module.exports = class Store extends esStore {

  constructor(settings) {

    super();

    this.settings = Object.assign({
      // Defaults
      // A bestSqlite db connection, need to be provided
      db: null,
      // A table that will be created and used to store sessions in
      tableName: 'sessions',
      // After how many minutes of inactivity a session is deleted
      // 0 = never delete
      deleteAfterInactivityMinutes: 120,
    }, settings);

    if (!this.settings.db || !this.settings.db.constructor.name === 'BestSqlite') {
      throw (new Error('Please provide a bestSqlite db connection!'));
    }
    this.db = this.settings.db;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS ${this.settings.tableName} (
        sid TEXT PRIMARY KEY NOT NULL UNIQUE,
        session TEXT,
        lastupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    setInterval(() => this.deleteAfterInactivity(), 10000);

  }

  // Most of the methods a express 
  // session store needs are documented here
  // https://www.npmjs.com/package/express-session#session-store-implementation

  // cb = callback
  // express sesion expects the store methods to reply
  // by calling a callback function

  all(cb = x => x) {
    cb(null, this.db.run(`
      SELECT session FROM ${this.settings.tableName}
    `).map(x => x.session));
  }

  destroy(sid, cb = x => x) {
    this.db.run(`
      DELETE FROM ${this.settings.tableName}
      WHERE sid = $sid
    `, { sid });
    cb(null);
  }

  clear(cb = x => x) {
    this.db.run(
      `DELETE FROM ${this.settings.tableName}`
    );
    cb(null);
  }

  length(cb = x => x) {
    cb(null, this.db.run(`
      SELECT COUNT(*) as len
      FROM ${this.settings.tableName}`)[0].len
    );
  }

  get(sid, cb = x => x) {
    let x = this.db.run(`
      SELECT session FROM ${this.settings.tableName}
      WHERE sid = $sid 
    `, { sid });
    x = x.length ? x[0].session : null;
    cb(null, JSON.parse(x));
  }

  set(sid, session, cb = x => x) {
    session = JSON.stringify(session);
    this.destroy(sid);
    this.db.run(`
      INSERT INTO ${this.settings.tableName} (sid, session)
      VALUES ($sid, $session) 
    `, { sid, session });
    cb(null);
  }

  touch(...args) {
    this.set(...args);
  }

  // Not documented: on is called on two eventhandlers 
  // 'connect' and 'disconnect'
  // so handle this by calling the callback if the event is connect
  // - since we are connected right away we will callback at once
  // - and we do not seem to need to handle disconnect...
  on(event, cb) {
    event === 'connect' && cb();
  }

  // Delete sessions after inactivity
  deleteAfterInactivity() {
    let m = this.settings.deleteAfterInactivityMinutes;
    if (!m) { return; }
    this.db.run(`
      DELETE FROM ${this.settings.tableName}
      WHERE (strftime('%s','now') - strftime('%s', lastupdate)) / 60 > $m
    `, { m });
  }

}