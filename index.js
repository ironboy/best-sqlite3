const { Worker } = require('worker_threads');
const inited = global.___SQL;
module.exports = inited && require('./BestSqlite');
if (!inited) {
  // note: require.cache used to get start script to run later
  new Worker('./starter.js', { workerData: Object.keys(require.cache)[0] });
}