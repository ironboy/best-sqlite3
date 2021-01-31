# best-sqlite3
What is **best-sqlite3**?
* A native JavaScript driver for running SQLite3 with Node.js.
* It does not need node-gyp or binaries when installed (in contrast to other SQLite3 drivers for node.js)
* It includes middleware for creating an Express Session store, storing Express-sessions in your SQLite3 database.

Some examples, working on a better README...

## Basic db api
```js
const bestSqlite = require('./index');
if (!bestSqlite) { return; } // important line

const db = bestSqlite.connect('my-fine-db.db');
let a = db.run('CREATE TABLE IF NOT EXISTS hello (a int, b string)');
let b = db.run('INSERT INTO hello VALUES ($a,$b)', { a: 0, b: 'Hello' });
let c = db.run('INSERT INTO hello VALUES ($a,$b)', { a: 1, b: 'Goodbye' });
db.regFunc('fancy', (x) => x + x);
let d = db.run('SELECT *, fancy(b) as c FROM hello WHERE a < $a', { a: 3 });
console.log(a, b, c, d);
```

## With Express Session
```js
const bestSqlite = require('./index');
if (!bestSqlite) { return; } // important line
const db = bestSqlite.connect('my-fine-session-db.db');

const express = require('express');
const session = require('express-session');
const app = express();

// When setting up express session
app.use(session({
  secret: 'your own secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' },
  // tell the store what bestSqlite connection to use
  store: db.sessionStore()
}));
```