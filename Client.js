const fetch = require('node-fetch');

module.exports = class Client {

  async connect(port, dbPath) {
    this.port = port;
    return await this.ask({ method: 'connect', args: [dbPath] }).catch(e => e);
  }

  async ask(q) {
    let r = await (await fetch('http://127.0.0.1:' + this.port, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    })).json();
    if (q.method === 'connect' && r.status) {
      this.filePath = r.filePath;
      return new Proxy({},
        { get: (...args) => this.get(...args) });
    }
    else {
      return r;
    }
  }

  get(_t, prop) {
    if (prop === 'then') { return Reflect.get(_t, prop); }
    return (...args) => this.method(prop, args);
  }

  async method(method, args) {
    return await this.ask({ filePath: this.filePath, method, args });
  }

}