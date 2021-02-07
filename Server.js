const http = require('http');
const path = require('path');
const bestSqlite = require(path.join(__dirname, './index'));
global.__bestSqliteRunningAsServer = true;

module.exports = class Server {

  openDBs = {};

  constructor(port) {
    port = typeof port !== 'number' || port < 0 || port > 65535 || port !== Math.floor(port) ? 27018 : port;
    this.server = http.createServer((req, res) => this.request(req, res));
    this.server.listen(port, () => console.log('Listening on port ' + port));
  }

  request(req, res) {
    res.setHeader('Content-Type', 'application/json');
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      this.answer(res, data).catch(e => {
        res.end(JSON.stringify({ error: e + '' }));
      });
    });
  }

  async answer(res, data) {
    data = JSON.parse(data);
    let method = data.method
    let args = data.args;
    let filePath = data.filePath;
    let db = this.openDBs[filePath];
    // connect to a db
    if (method === 'connect') {
      let db = await bestSqlite.connect(args[0]);
      if (!this.openDBs[db.filePath]) {
        this.openDBs[db.filePath] = db;
        res.end(JSON.stringify({ status: 'new connection', filePath: db.filePath }));
        return;
      }
      res.end(JSON.stringify({ status: 'already connected', filePath: db.filePath }));
      return;
    }
    // query the db
    res.end(JSON.stringify(db[method](...args)));
  }

}