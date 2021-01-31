# best-sqlite3
What is **best-sqlite3**?
* A native JavaScript driver for running SQLite3 with Node.js.
* It does not need node-gyp or binaries when installed (in contrast to other SQLite3 drivers for node.js)
* It includes middleware for creating an Express Session store, storing Express-sessions in your SQLite3 database.

Some examples, working on a better README...

## Basic db api
```js
const bestSqlite = require('./index');

async function bestSQliteBasicDemo() {
  const db = await bestSqlite.connect('my-fine-db.db');
  let a = db.run('CREATE TABLE IF NOT EXISTS hello (a int, b string)');
  let b = db.run('INSERT INTO hello VALUES ($a,$b)', { a: 0, b: 'Hello' });
  let c = db.run('INSERT INTO hello VALUES ($a,$b)', { a: 1, b: 'Goodbye' });
  db.regFunc('fancy', (x) => x + x);
  let d = db.run('SELECT *, fancy(b) as c FROM hello WHERE a < $a', { a: 3 });
  console.log(a, b, c, d);
}

bestSQliteBasicDemo();
```

## With Express Session
```js
const express = require('express');
const session = require('express-session');
const bestSqlite = require('./index');

async function bestSQliteExpressSessionDemo() {
  const app = express();
  const db = await bestSqlite.connect('my-fine-session-db.db');

  // Setting up the express session middleware
  // with bestSqlite a store
  app.use(session({
    secret: 'your own secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' },
    // tell express session to use our bestSqlite connection
    // (this will store the sessions in the database)
    store: db.sessionStore(
      // Optional settings
      {
        tableName: 'sessions', // What table to store sessions in
        deleteAfterInactivityMinutes: 120 // Minutes a session lives
      }
    )
  }));

  // Check that sessions work (restart to see the urls still remembered)
  app.get('*', (req, res) => {
    let { visited } = req.session;
    if (!visited) { visited = req.session.visited = []; }
    req.url !== '/favicon.ico' && visited.push(req.url);
    res.send('Visited urls:<br>' + visited.join('<br>'));
  });

  app.listen(3000, () => console.log('Listening on port 3000!'));

}

bestSQliteExpressSessionDemo();
```