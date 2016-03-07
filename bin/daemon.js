'use strict';

const argv = require('yargs').argv;
let PubMQServer = require("../pubmq.js").Server;

let server = new PubMQServer({
  ttl: argv.t,
  size: argv.q
});

server.listen(argv.p);