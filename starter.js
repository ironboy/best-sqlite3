const { workerData } = require('worker_threads');
const sqlJs = require('sql.js');
(async () => {
  global.___SQL = await sqlJs();
  global.___appPath = workerData;
  require(workerData);
})().catch(e => console.error(e));