const bestSqlite = require('../index.js');
global.doNotDelete = false;
const fs = require('fs');
const path = require('path');
const now = function now(unit) {
  const hrTime = process.hrtime();
  switch (unit) {
    case 'milli':
      return hrTime[0] * 1000 + hrTime[1] / 1000000;
    case 'micro':
      return hrTime[0] * 1000000 + hrTime[1] / 1000;
    case 'nano':
      return hrTime[0] * 1000000000 + hrTime[1];
    default:
      return now('nano');
  }
};
const format = function (ms) {
  ms = ms.toFixed(2);
  ms = ms.padStart(7, ' ');
  return ms + ' ms';
};
const dbName = path.join(__dirname, 'test-db.db');


(async () => {

  console.log('\n\nbest-sqlite3');
  console.log('------------------')

  fs.existsSync(dbName)
    && fs.unlinkSync(dbName);

  const db = await bestSqlite.connect(dbName);
  //.connect(27018, dbName);

  await db.run(/*sql*/`
    CREATE TABLE users (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT
                          UNIQUE
                          NOT NULL,
      userName   TEXT     UNIQUE
                          NOT NULL,
      firstName  TEXT     NOT NULL,
      lastName   TEXT     NOT NULL,
      registered DATETIME NOT NULL
                          DEFAULT (CURRENT_TIMESTAMP) 
    );
  `);

  console.log(await db.tables);
  console.log(await db.views);

  let start = now('milli');
  for (let i = 1; i <= 1000; i++) {
    await db.run(/*SQL*/`
      INSERT INTO users (userName, firstName, lastName)
      VALUES  ($userName, $firstName, $lastName)
    `, { userName: 'user' + i, firstName: 'Jane ' + i, lastName: 'Doe ' + i });
  }
  console.log('INSERTS', format(now('milli') - start));

  start = now('milli');
  for (let i = 1; i <= 1000; i++) {
    await db.run(/*sql*/`
      SELECT * FROM users WHERE id = $id
    `, { id: i });
  }
  console.log('SELECTS', format(now('milli') - start));

  start = now('milli');
  for (let i = 1; i <= 1000; i++) {
    await db.run(/*sql*/`
      UPDATE users SET firstName = $firstName
      WHERE id = $id
    `, { firstName: 'Jane Updated ' + i, id: i });
  }
  console.log('UPDATES', format(now('milli') - start));

  if (global.doNotDelete) { return; }
  start = now('milli');
  for (let i = 1; i <= 1000; i++) {
    await db.run(/*sql*/`
      DELETE FROM users WHERE id = $id
    `, { id: i });
  }
  console.log('DELETES', format(now('milli') - start));


})();