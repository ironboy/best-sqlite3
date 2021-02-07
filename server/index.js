const path = require('path');
const Server = require(path.join(__dirname, '../Server.js'));
new Server(+process.argv[2]);