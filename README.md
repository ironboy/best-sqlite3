# best-sqlite3

## What is SQLite3?
[SQLite](https://www.sqlite.org/index.html), version 3, is an *RDBMS* -  relational database management system written in C.

It differs from most other systems (MySQL, Postgre etc) in that there is not a separate server running the database, instead the SQLite code gets embedded in the application you are writing.

SQLite stores a whole database in *one* single file.

If you want a graphical editor for SQLite we recommend [SQLiteStudio](https://sqlitestudio.pl/) - cross platform, with a nice GUI.

**Note:**
The SQL dialect spoken by SQLite is similar to the syntax in PostgreSQL and rather similar to MySQL/MariaDB. An important difference compared to MySQL/MariaDB is that you *can not* use *&&* instead of AND or *||* instead of OR. Just get used to writing AND and OR!

## What is **best-sqlite3**?
* **best-sqlite3** is a driver that lets you run *SQLite3* with Node.js.
* It differs from other Node.js drivers in that it does not need *node-gyp* or any binaries during installation, because it runs SQLite3 recompiled to JavaScript/webassembly (thanks to the [SQL.js](https://www.npmjs.com/package/sql.js]) project)
* **best-sqlite3** provides a simple API and guarantees you that you won't run into problems with compiling bindings to other languages - the npm installation will be trouble free regardless of your operating system, Node.js version etc.
* **best-sqlite3** is quite fast. See the tests below comparing it to the drivers [sqlite3](https://www.npmjs.com/package/sqlite3) and [better-sqlite3](https://www.npmjs.com/package/better-sqlite3).

Also:
* **best-sqlite3** includes middleware for creating an [Express Session store](https://www.npmjs.com/package/express-session#api), with which you can store Express-sessions in your SQLite3 database, making them survive server restarts.

## Installation
```
npm i best-sqlite3
```

## Basic usage
Require **best-sqlite3** and connect to a database, then run queries.

```js
(async () => { // start of async wrapper

  // Require bestSqlite
  const bestSqlite = require('best-sqlite3');

  // Connect to a database
  // (if the file does not exist 
  //  a new db will be created)
  const db = await bestSqlite
    .connect('path-to-db-file.sqlite3');

  // Run a query
  let allUsers = db.run(`
    SELECT * FROM users
  `);

  // Run a query with parameters
  // (a prepared statement)
  let allJanes = db.run(
    `
      SELECT * FROM users
      WHERE firstName = $firstName
    `, 
    {
      firstName: 'Jane'
    }
  );


})().catch(e => console.error(e)); 
// end of async wrapper
```

## What does the run-method return?
* For SELECT-queries *run* will return an array of objects. Each object corresponds to a row in the database.
* For other statements (CREATE, INSERT, UPDATE, DELETE) *run* returns an object with the property **rowsModified** (number of rows modified) 
* For INSERT statements the property **lastInsertRowId** (the id of the latest row inserted) is also provided.

## User defined functions with the regFunc-method
You can define your own functions written in JavaScript that you can then use in your SQL-queries.

```js
// Register a function
db.regFunc('concatWithSpace', (x, y) => x + ' ' + y);

// Use the function in your query
db.run(`
  SELECT concatWithSpace(firstName, lastName) AS fullName
  FROM users
`);
```

## Lists tables and views in a database
You can easily get a list (array of strings) with the names of the tables in a database. The same goes for all the views in a database...

```js
// db.tables - a list of all tables in the database
console.log(db.tables);

// db.views - a list of all views in the database
console.log(db.views);
```

## Storing express-session sessions in the database
The npm module [express-session](https://www.npmjs.com/package/express-session) is used to get user sessions based on cookies to work with [express](https://www.npmjs.com/package/express) (the popular web server for Node.js).

By default **express-session** stores session in internal memory, but its documentation recommend against doing so in production. 

**best-sqlite3** provides middleware that can be used together with **express-session** to automatically store sessions in the database instead.

```js
(async () => { // start of async wrapper

  const express = require('express');
  const session = require('express-session');
  const bestSqlite = require('best-sqlite3');

  const app = express();
  const db = await bestSqlite.connect('path-to-db-file.sqlite3');

  // Setting up the express session middleware
  // with bestSqlite as a store
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
        // What table to store sessions in
        tableName: 'sessions', 
        // Minutes a session lives after inactivity
        deleteAfterInactivityMinutes: 120
      }
    )
  }));

  // Check that storing sessions in the db works 
  // (restart your app/server to see that 
  //  the urls are still remembered)
  app.get('*', (req, res) => {
    let { visited } = req.session;
    if (!visited) { visited = req.session.visited = []; }
    req.url !== '/favicon.ico' && visited.push(req.url);
    res.send('Visited urls:<br>' + visited.join('<br>'));
  });

  app.listen(3000, () => console.log('Listening on port 3000!'));

})().catch(e => console.error(e)); 
// end of async wrapper
```

### Speed tests
[You can find the code used for running the tests described below here](https://github.com/ironboy/sqlite-drivers-for-noide-speed-comparison).

#### Comparing the speed of these three SQLite3 drivers for Node.js
Which drivers?
* sqlite3
* better-sqlite3
* best-sqlite3

#### Which tests are run?
In a table with 5 columns (one id column with auto increment, 3 string columns - using short strings, and one timestamp column) do the following:
* run 1000 insert of single rows
* run 1000 selects (of single rows by id)
* run 1000 updates (each for a single row, found by id)
* run 1000 deletes (each of a single row by id)

#### Results
Results on a Macbook 2017 with an i5 processor and db:s stored on the internal SSD:

```
sqlite3
------------------
INSERTS 1824.37 ms
SELECTS  111.30 ms
UPDATES 1613.14 ms
DELETES 1386.40 ms


better-sqlite3
------------------
INSERTS 1159.83 ms
SELECTS   53.23 ms
UPDATES 1661.20 ms
DELETES 1440.97 ms


best-sqlite3
------------------
INSERTS  344.90 ms
SELECTS   87.61 ms
UPDATES  166.80 ms
DELETES  174.07 ms
```